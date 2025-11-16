import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Plus, Edit, Trash2, Mail, Users, Search, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

import { useDebounce } from "../../hooks/useDebounce"; 
import { cn } from "../ui/utils";

interface Fornecedor {
  idFornecedor: number;
  nome: string;
  email: string;
  ativo: boolean;
}
interface ApiResponse<T> {
  content: T[];
  totalPages: number;
  number: number;
  first: boolean;
  last: boolean;
  totalElements: number;
}

interface FornecedoresProps {
  userRole: string;
}

export function Fornecedores({ userRole }: FornecedoresProps) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
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
  const [formData, setFormData] = useState({ nome: "", email: "" });
  const [isSaving, setIsSaving] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertItem, setAlertItem] = useState<{ action: 'delete' | 'reactivate', data: Fornecedor } | null>(null);

  const isOperador = userRole?.toUpperCase() === "OPERADOR" || userRole?.toUpperCase() === "ROLE_OPERADOR";

  const fetchFornecedores = async (page = 0, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("status", statusFilter);
      params.append("page", String(page));
      params.append("size", "11");
      
      if (search) {
        params.append("search", search);
      }
      
      const response = await api.get<ApiResponse<Fornecedor>>(
        `/fornecedores?${params.toString()}`
      );
      
      setFornecedores(response.data.content);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.number);
      setIsFirstPage(response.data.first);
      setIsLastPage(response.data.last);

    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast.error("Erro ao carregar a lista de fornecedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    fetchFornecedores(currentPage, debouncedSearchTerm);
  }, [currentPage, statusFilter, debouncedSearchTerm]);


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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/fornecedores/${editingId}`, formData);
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        await api.post("/fornecedores", formData);
        toast.success("Fornecedor cadastrado com sucesso!");
      }
      setIsDialogOpen(false);
      
      fetchFornecedores(editingId ? currentPage : 0, debouncedSearchTerm); 
      if (!editingId) setCurrentPage(0); 
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao salvar fornecedor.");
    } finally {
      setIsSaving(false);
    }
  };

  const requestAction = (action: 'delete' | 'reactivate', fornecedor: Fornecedor) => {
    setAlertItem({ action, data: fornecedor });
    setIsAlertOpen(true);
  };

  const confirmAction = async () => {
    if (!alertItem) return;
    const { action, data } = alertItem;
    try {
      if (action === 'delete') {
        await api.delete(`/fornecedores/${data.idFornecedor}`);
        toast.success("Fornecedor desativado com sucesso!");
      } else if (action === 'reactivate') {
        await api.patch(`/fornecedores/${data.idFornecedor}`, { ativo: true });
        toast.success("Fornecedor reativado com sucesso!");
      }
      fetchFornecedores(currentPage, debouncedSearchTerm); 
    } catch (error: any) {
      toast.error(`Erro ao ${action === 'delete' ? 'desativar' : 'reativar'} fornecedor.`);
    } finally {
      setIsAlertOpen(false);
      setAlertItem(null);
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingId(fornecedor.idFornecedor);
    setFormData({ nome: fornecedor.nome, email: fornecedor.email });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingId(null);
    setFormData({ nome: "", email: "" });
    setIsDialogOpen(true);
  };

  if (loading && fornecedores.length === 0) {
    return <div className="p-6 space-y-4">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-64 w-full" />
    </div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie os parceiros e produtores</p>
        </div>
        
        {isOperador && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} className="btn-calcana shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Atualize as informações." : "Preencha os dados para cadastrar."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome / Razão Social</Label>
                  <Input id="nome" value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} placeholder="João Dias" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="joaodias@gmail.com" required />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                  <Button type="submit" className="btn-calcana" disabled={isSaving}>
                    {isSaving ? "Salvando..." : (editingId ? "Atualizar" : "Cadastrar")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Fornecedores
          </CardTitle>
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="bg-input-background w-full sm:w-[130px]">
                <SelectValue placeholder="Selecione o status..."/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-8 bg-input-background w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn("transition-opacity", loading ? "opacity-50" : "opacity-100")}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  {isOperador && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && fornecedores.length === 0 ? (
                  <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                ) : fornecedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isOperador ? 4 : 3} className="text-center py-8 text-muted-foreground">
                      {searchTerm 
                        ? `Nenhum fornecedor encontrado para "${searchTerm}".`
                        : `Nenhum fornecedor encontrado para "${statusFilter}".`
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  fornecedores.map((fornecedor) => ( 
                    <TableRow key={fornecedor.idFornecedor}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{fornecedor.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={fornecedor.ativo ? "default" : "destructive"}
                          className={fornecedor.ativo ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {fornecedor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      {isOperador && (
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(fornecedor)}
                              className=" hover:text-primary hover:bg-green-50 hover:border-green-200"
                              disabled={!fornecedor.ativo}
                              title={fornecedor.ativo ? "Editar Fornecedor" : "Reative o fornecedor para editar"}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            {fornecedor.ativo ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => requestAction('delete', fornecedor)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                                title="Desativar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => requestAction('reactivate', fornecedor)}
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
          </div>
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

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className={alertItem?.action === 'delete' ? "text-destructive" : "text-green-600"} />
              Confirmar {alertItem?.action === 'delete' ? 'Desativação' : 'Reativação'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {alertItem?.action === 'delete' ? 'DESATIVAR' : 'REATIVAR'} o fornecedor 
              <strong> "{alertItem?.data.nome}"</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction} 
              className={alertItem?.action === 'delete' ? buttonVariants({ variant: "destructive" }) : "btn-calcana"}
            >
              Sim, {alertItem?.action === 'delete' ? 'Desativar' : 'Reativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}