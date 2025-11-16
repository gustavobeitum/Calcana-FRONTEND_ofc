import { useState, useEffect } from "react";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Plus, Edit, Trash2, Building, MapPin, User, AlertTriangle, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { cn } from "../ui/utils";

import { useDebounce } from "../../hooks/useDebounce";

interface Cidade { idCidade: number; nome: string; uf: string; }
interface Fornecedor { idFornecedor: number; nome: string; }
interface Propriedade { idPropriedade: number; nome: string; ativo: boolean; fornecedor: Fornecedor; cidade: Cidade; }
interface PropriedadesProps { userRole: string; }

interface ApiResponse<T> {
  content: T[];
  totalPages: number;
  number: number;
  first: boolean;
  last: boolean;
  totalElements: number;
}

export function Propriedades({ userRole }: PropriedadesProps) {
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const [statusFilter, setStatusFilter] = useState("ativos"); 
  
  const [currentPage, setCurrentPage] = useState(0); 
  const [totalPages, setTotalPages] = useState(0);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [isLastPage, setIsLastPage] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isCidadeDialogOpen, setIsCidadeDialogOpen] = useState(false);
  const [novaCidade, setNovaCidade] = useState({ nome: "", uf: "" });
  const [isSavingCidade, setIsSavingCidade] = useState(false);
  
  const [formData, setFormData] = useState({ nome: "", idFornecedor: "", idCidade: "" });

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'propriedade' | 'cidade', id: number, nome: string } | null>(null);

  const isOperador = userRole?.toUpperCase() === "OPERADOR" || userRole?.toUpperCase() === "ROLE_OPERADOR";

  const fetchDados = async (page = 0, search = "") => {
    try {
      setLoading(true);

      const propsParams = new URLSearchParams();
      propsParams.append("status", statusFilter);
      propsParams.append("page", String(page));
      propsParams.append("size", "11");
      if (search) {
        propsParams.append("search", search);
      }

      const [propsRes, fornsRes, cidsRes] = await Promise.all([
        api.get<ApiResponse<Propriedade>>(`/propriedades?${propsParams.toString()}`),
        api.get<{ content: Fornecedor[] }>("/fornecedores?status=ativos&size=999"), 
        api.get<Cidade[]>("/cidades")
      ]);
      
      setPropriedades(propsRes.data.content);
      setTotalPages(propsRes.data.totalPages);
      setCurrentPage(propsRes.data.number);
      setIsFirstPage(propsRes.data.first);
      setIsLastPage(propsRes.data.last);

      setFornecedores(fornsRes.data.content); 
      setCidades(cidsRes.data);
    } catch (error) {
      toast.error("Erro ao carregar informações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setCurrentPage(0);
  }, [statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    fetchDados(currentPage, debouncedSearchTerm);
  }, [statusFilter, currentPage, debouncedSearchTerm]);


  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleNextPage = () => {
    if (!isLastPage) {
      setCurrentPage(prev => prev + 1);
    }
  };
  const handlePreviousPage = () => {
    if (!isFirstPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSubmitPropriedade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idFornecedor || !formData.idCidade) {
      toast.error("Selecione um fornecedor e uma cidade.");
      return;
    }
    setIsSaving(true);
    const payload = {
      nome: formData.nome,
      fornecedor: { idFornecedor: parseInt(formData.idFornecedor) },
      cidade: { idCidade: parseInt(formData.idCidade) },
      ativo: true
    };
    try {
      if (editingId) {
        await api.put(`/propriedades/${editingId}`, payload);
        toast.success("Propriedade atualizada!");
      } else {
        await api.post("/propriedades", payload);
        toast.success("Propriedade cadastrada!");
      }
      setIsDialogOpen(false);
      
      fetchDados(editingId ? currentPage : 0, debouncedSearchTerm); 
      if (!editingId) setCurrentPage(0); 

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao salvar propriedade.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSalvarNovaCidade = async () => { 
    if (!novaCidade.nome || !novaCidade.uf) {
      toast.error("Preencha nome e UF.");
      return;
    }
    setIsSavingCidade(true);
    try {
      const response = await api.post("/cidades", novaCidade);
      const cidadeCriada = response.data;
      toast.success(`Cidade ${cidadeCriada.nome} cadastrada!`);
      setCidades((prev) => [...prev, cidadeCriada]);
      setIsCidadeDialogOpen(false); 
      setNovaCidade({ nome: "", uf: "" }); 
    } catch (error) {
      toast.error("Erro ao cadastrar cidade.");
    } finally {
      setIsSavingCidade(false);
    }
  };


  const requestDelete = (e: React.SyntheticEvent, type: 'propriedade' | 'cidade', id: number, nome: string) => {
    e.stopPropagation();
    e.preventDefault();
    setItemToDelete({ type, id, nome });
    setDeleteAlertOpen(true);
  };

  const handleReativar = async (propriedade: Propriedade) => {
    try {
      await api.patch(`/propriedades/${propriedade.idPropriedade}`, { ativo: true });
      toast.success(`Propriedade "${propriedade.nome}" reativada!`);
      fetchDados(currentPage, debouncedSearchTerm);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Erro ao reativar propriedade.";
      toast.error(msg, { description: "Verifique se o fornecedor desta propriedade está ativo."});
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'propriedade') {
        await api.delete(`/propriedades/${itemToDelete.id}`);
        toast.success("Propriedade desativada!");
        fetchDados(currentPage, debouncedSearchTerm);
      } else {
        await api.delete(`/cidades/${itemToDelete.id}`);
        toast.success(`Cidade "${itemToDelete.nome}" excluída!`);
        setCidades(prev => prev.filter(c => c.idCidade !== itemToDelete.id));
        if (formData.idCidade === String(itemToDelete.id)) {
          setFormData(prev => ({ ...prev, idCidade: "" }));
        }
      }
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      if (itemToDelete.type === 'cidade' && error.response?.status !== 404) {
         toast.error("Não é possível excluir: Cidade em uso.");
      } else {
         toast.error("Erro ao realizar a exclusão.");
      }
    } finally {
      setDeleteAlertOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEdit = (prop: Propriedade) => {
    setEditingId(prop.idPropriedade);
    setFormData({
      nome: prop.nome,
      idFornecedor: String(prop.fornecedor.idFornecedor),
      idCidade: String(prop.cidade.idCidade)
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingId(null);
    setFormData({ nome: "", idFornecedor: "", idCidade: "" });
    setIsDialogOpen(true);
  };

  if (loading && propriedades.length === 0) return <div className="p-6 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Propriedades</h1>
          <p className="text-muted-foreground">Gerencie as propriedades rurais</p>
        </div>
        
        {isOperador && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} className="btn-calcana shadow-lg">
                <Plus className="w-4 h-4 mr-2" /> Nova Propriedade
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Propriedade" : "Nova Propriedade"}</DialogTitle>
                <DialogDescription>Preencha os dados da propriedade rural.</DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto -mr-6 pr-6">
                <form id="propriedade-form" onSubmit={handleSubmitPropriedade} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Propriedade</Label>
                    <Input id="nome" value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} placeholder="Ex: Fazenda Boa Vista" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Select value={formData.idFornecedor} onValueChange={(value) => setFormData(prev => ({ ...prev, idFornecedor: value }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {fornecedores.map(f => <SelectItem key={f.idFornecedor} value={String(f.idFornecedor)}>{f.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                       <Select value={formData.idCidade} onValueChange={(value) => setFormData(prev => ({ ...prev, idCidade: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione...">
                              {formData.idCidade 
                                ? (() => {
                                    const c = cidades.find(cid => String(cid.idCidade) === formData.idCidade);
                                    return c ? `${c.nome} - ${c.uf}` : "Selecione...";
                                  })()
                                : undefined
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {cidades.map(c => (
                              <SelectItem key={c.idCidade} value={String(c.idCidade)} textValue={`${c.nome} - ${c.uf}`} className="cursor-pointer w-full">
                                  <div className="flex items-center w-full gap-2 pr-2">
                                    <span className="truncate font-normal">{c.nome} - {c.uf}</span>
                                    <div 
                                      className="shrink-0 p-1.5 rounded-md hover:bg-red-200 text-muted-foreground hover:text-red-600 transition-colors z-50"
                                      onPointerDown={(e) => requestDelete(e, 'cidade', c.idCidade, c.nome)}
                                      title="Excluir cidade"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </div>
                                  </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setIsCidadeDialogOpen(true)}
                        title="Adicionar nova cidade"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" form="propriedade-form" className="btn-calcana" disabled={isSaving}>Salvar</Button> 
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Lista de Propriedades
          </CardTitle>
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="bg-input-background w-full sm:w-[130px]">
                <SelectValue placeholder="Selecione o status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativos">Ativas</SelectItem>
                <SelectItem value="inativos">Inativas</SelectItem>
                <SelectItem value="todos">Todas</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, fornecedor..."
                className="pl-8 bg-input-background w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn("transition-opacity", loading ? "opacity-50" : "opacity-100")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Fornecedor</TableHead><TableHead>Cidade</TableHead><TableHead>Status</TableHead>
                {isOperador && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && propriedades.length === 0 ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : propriedades.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm
                      ? `Nenhuma propriedade encontrada para "${searchTerm}".`
                      : `Nenhuma propriedade encontrada para "${statusFilter}".`
                    }
                  </TableCell>
                </TableRow>
              ) : (
                propriedades.map((prop) => (
                  <TableRow key={prop.idPropriedade}>
                    <TableCell className="font-medium">{prop.nome}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{prop.fornecedor?.nome}</div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{prop.cidade?.nome}/{prop.cidade?.uf}</div></TableCell>
                    <TableCell><Badge variant={prop.ativo ? "default" : "destructive"} className={prop.ativo ? "bg-green-600 hover:bg-green-700" : ""}>{prop.ativo ? "Ativa" : "Inativa"}</Badge></TableCell>
                    {isOperador && (
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(prop)} 
                            className=" hover:text-primary hover:bg-green-50 hover:border-green-200"
                            disabled={!prop.ativo}
                            title={prop.ativo ? "Editar Propriedade" : "Reative a propriedade para editar"}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          {prop.ativo ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => requestDelete(e, 'propriedade', prop.idPropriedade, prop.nome)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-100 hover:border-red-200"
                              title="Desativar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReativar(prop)}
                              className=" hover:text-primary hover:bg-green-50 hover:border-green-200"
                              title="Reativar"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              Página {currentPage + 1} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={handlePreviousPage}
                disabled={isFirstPage || loading}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={isLastPage || loading}
                variant="outline"
                size="sm"
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja {itemToDelete?.type === 'propriedade' ? 'desativar' : 'excluir'} 
              {" "}o item <strong>"{itemToDelete?.nome}"</strong>?
              <br/><br/>
              {itemToDelete?.type === 'cidade' 
                ? "Esta ação é irreversível. Se a cidade estiver em uso, a exclusão será bloqueada."
                : "A propriedade ficará inativa no sistema."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className={buttonVariants({ variant: itemToDelete?.type === 'propriedade' ? 'destructive' : 'destructive' })}
            >
              Sim, {itemToDelete?.type === 'propriedade' ? 'Desativar' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCidadeDialogOpen} onOpenChange={setIsCidadeDialogOpen}>
        <DialogContent className="sm:max-w-[400px] z-[150]">
          <DialogHeader><DialogTitle>Nova Cidade</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input 
                value={novaCidade.nome} 
                onChange={e => setNovaCidade(prev => ({...prev, nome: e.target.value}))} 
                placeholder="Ex: Assis" 
              />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input 
                value={novaCidade.uf} 
                onChange={e => setNovaCidade(prev => ({...prev, uf: e.target.value.toUpperCase()}))} 
                maxLength={2} 
                placeholder="SP"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              className="btn-calcana" 
              onClick={handleSalvarNovaCidade}
              disabled={isSavingCidade}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}