import { useState, useEffect } from "react"; 
import { Button } from "../ui/button"; 
import { Input } from "../ui/input"; 
import { Label } from "../ui/label"; 
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"; 
import { Badge } from "../ui/badge"; 
import { Calendar, Search, Eye, History, TestTube, FileSpreadsheet, Send, FileDown, 
FileText, Check, Download, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, 
DialogFooter } from "../ui/dialog"; 
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
import { Separator } from "../ui/separator"; 
import api from "../../services/api"; 
import { toast } from "sonner"; 
import { Skeleton } from "../ui/skeleton"; 
import { cn } from "../ui/utils"; 
 
interface Analise { 
  idAnalise: number; 
  numeroAmostra: number; 
  dataAnalise: string; 
  zona: string; 
  talhao: string; 
  corte: number; 
  pbu: number; 
  brix: number; 
  leituraSacarimetrica: number; 
  atr: number; 
  pureza: number; 
  polCana: number; 
  polCaldo: number; 
  fibra: number; 
  arCana: number; 
  arCaldo: number; 
  leituraSacarimetricaCorrigida: number; 
  observacoes?: string; 
  statusEnvioEmail: boolean;
  propriedade: { 
    idPropriedade: number; 
    nome: string; 
    fornecedor: { 
      idFornecedor: number; 
      nome: string; 
      email: string; 
    } 
  }; 
  usuarioLancamento: { 
    idUsuario: number; 
    nome: string; 
  } 
} 
 
interface ApiResponse<T> { 
  content: T[]; 
  totalPages: number; 
  number: number; 
  first: boolean; 
  last: boolean; 
  totalElements: number; 
} 
 
interface Fornecedor { 
  idFornecedor: number; 
  nome: string; 
} 
 
interface PropriedadeFiltro { 
  idPropriedade: number; 
  nome: string; 
} 
 
interface HistoricoProps { 
  userRole: string; 
} 
 
export function Historico({ userRole }: HistoricoProps) { 
  const [analises, setAnalises] = useState<Analise[]>([]); 
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]); 
  const [propriedades, setPropriedades] = useState<PropriedadeFiltro[]>([]); 
  const [loading, setLoading] = useState(true); 
 
  const [isExporting, setIsExporting] = useState(false); 
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false); 
  const [exportLayout, setExportLayout] = useState("default"); 
 
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null); 
 
  const [isSendAlertOpen, setIsSendAlertOpen] = useState(false); 
  const [analiseParaEnviar, setAnaliseParaEnviar] = useState<Analise | null>(null);
 
  const [currentPage, setCurrentPage] = useState(0);  
  const [totalPages, setTotalPages] = useState(0); 
  const [isFirstPage, setIsFirstPage] = useState(true); 
  const [isLastPage, setIsLastPage] = useState(true); 
  const [totalElements, setTotalElements] = useState(0); 
 
  const [filtros, setFiltros] = useState({ 
    fornecedor: "", 
    propriedade: "", 
    talhao: "", 
    dataInicio: "", 
    dataFim: "" 
  }); 
 
  const [analiseDetalhada, setAnaliseDetalhada] = useState<Analise | null>(null); 
 
  const fetchAnalises = async (page = 0, showToast = false) => { 
    setLoading(true); 
    const params = new URLSearchParams(); 
 
    if (filtros.fornecedor && filtros.fornecedor !== "todos") params.append("fornecedorId", filtros.fornecedor); 
    if (filtros.propriedade && filtros.propriedade !== "todas") params.append("propriedadeIds", filtros.propriedade); 
    if (filtros.talhao) params.append("talhao", filtros.talhao); 
    if (filtros.dataInicio) params.append("dataInicio", filtros.dataInicio); 
    if (filtros.dataFim) params.append("dataFim", filtros.dataFim); 
 
    params.append("page", String(page)); 
    params.append("size", "10"); 
 
    try { 
      const response = await api.get<ApiResponse<Analise>>(`/analises?${params.toString()}`); 
 
      setAnalises(response.data.content); 
      setTotalPages(response.data.totalPages); 
      setCurrentPage(response.data.number); 
      setIsFirstPage(response.data.first); 
      setIsLastPage(response.data.last); 
      setTotalElements(response.data.totalElements); 
 
      if (showToast) { 
        toast.success(`${response.data.totalElements} análises encontradas.`); 
      } 
 
    } catch (error: any) { 
      toast.error("Erro ao filtrar dados."); 
    } finally { 
      setLoading(false); 
    } 
  }; 
 
  useEffect(() => { 
    const carregarFornecedores = async () => { 
      try { 
        const fornData = await api.get<{ content: Fornecedor[] }>("/fornecedores?status=ativos&size=20"); 
        setFornecedores(fornData.data.content); 
      } catch (error: any) { 
        toast.error("Erro ao carregar fornecedores."); 
      } 
    }; 
    carregarFornecedores(); 
  }, []); 
 
  useEffect(() => { 
    fetchAnalises(currentPage, false); 
  }, [currentPage]);  
 
  useEffect(() => { 
    const isFirstLoad = currentPage === 0 && Object.values(filtros).every(f => f === ""); 
    fetchAnalises(currentPage, !isFirstLoad); 
  }, [filtros]); 
 
  useEffect(() => { 
    if (!filtros.fornecedor || filtros.fornecedor === "todos") { 
      setPropriedades([]); 
      return; 
    } 
    api.get<PropriedadeFiltro[]>(`/propriedades/por-fornecedor/${filtros.fornecedor}`) 
      .then(res => setPropriedades(res.data)) 
      .catch(() => toast.error("Erro ao carregar propriedades.")); 
  }, [filtros.fornecedor]); 
 
  const handleFiltrar = () => { 
    setCurrentPage(0);  
    if (currentPage === 0) { 
      fetchAnalises(0, true); 
    } 
  }; 
 
  const handleLimparFiltros = async () => { 
    setFiltros({ fornecedor: "", propriedade: "", talhao: "", dataInicio: "", dataFim: "" }); 
    setCurrentPage(0); 
    if (currentPage === 0) { 
      fetchAnalises(0, true); 
    } 
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
 
  const handleConfirmExport = async () => { 
    try { 
      setIsExporting(true); 
      const params = new URLSearchParams(); 
 
      params.append("layout", exportLayout); 
 
      if (filtros.fornecedor && filtros.fornecedor !== "todos") params.append("fornecedorId", filtros.fornecedor); 
      if (filtros.propriedade && filtros.propriedade !== "todas") params.append("propriedadeIds", filtros.propriedade);  
      if (filtros.talhao) params.append("talhao", filtros.talhao); 
      if (filtros.dataInicio) params.append("dataInicio", filtros.dataInicio); 
      if (filtros.dataFim) params.append("dataFim", filtros.dataFim); 
 
      const response = await api.get(`/relatorios/analises/excel?${params.toString()}`, { 
        responseType: 'blob' 
      }); 
 
      const url = window.URL.createObjectURL(new Blob([response.data])); 
      const link = document.createElement('a'); 
      link.href = url; 
      link.setAttribute('download', `relatorio_${exportLayout}_${new Date().toISOString().split('T')[0]}.xlsx`); 
      document.body.appendChild(link); 
      link.click(); 
      link.remove(); 
 
      toast.success("Download do Excel iniciado!"); 
      setIsExportDialogOpen(false);  
 
    } catch (error) { 
      console.error(error); 
      toast.error("Erro ao baixar Excel."); 
    } finally { 
      setIsExporting(false); 
    } 
  }; 
 
  const baixarBoletimPDF = async (idAnalise: number, numeroAmostra: number) => { 
    try { 
      const response = await api.get(`/relatorios/analise/${idAnalise}/pdf`, { 
        responseType: 'blob' 
      }); 
 
      const url = window.URL.createObjectURL(new Blob([response.data])); 
      const link = document.createElement('a'); 
      link.href = url; 
      link.setAttribute('download', `Boletim_Amostra_${numeroAmostra}.pdf`); 
      document.body.appendChild(link); 
      link.click(); 
      link.remove(); 
      toast.success("Boletim PDF baixado!"); 
 
    } catch (error) { 
      console.error(error); 
      toast.error("Erro ao gerar PDF."); 
    } 
  }; 
 
  const handleSendEmailClick = (analise: Analise) => { 
    setAnaliseParaEnviar(analise); 
    setIsSendAlertOpen(true); 
  }; 
 
  const confirmSendEmail = async () => { 
    if (!analiseParaEnviar) return; 
 
    setSendingEmailId(analiseParaEnviar.idAnalise); 
    try { 
      await api.post(`/relatorios/analise/${analiseParaEnviar.idAnalise}/enviar`); 
      toast.success("E-mail enviado com sucesso para o fornecedor!"); 
 
      setAnalises(prev => prev.map(a =>  
        a.idAnalise === analiseParaEnviar.idAnalise ? { ...a, statusEnvioEmail: true } : a 
      )); 
 
    } catch (error: any) { 
      console.error(error); 
      toast.error("Erro ao enviar e-mail. Verifique se o fornecedor possui e-mail cadastrado."); 
    } finally { 
      setSendingEmailId(null); 
      setIsSendAlertOpen(false); 
      setAnaliseParaEnviar(null); 
    } 
  };
 
  const getATRColor = (atr: number) => { 
    if (atr >= 150) return "text-green-600 dark:text-green-400"; 
    if (atr >= 140) return "text-yellow-600 dark:text-yellow-400"; 
    return "text-red-600 dark:text-red-400"; 
  }; 
 
  return ( 
    <div className="p-6 space-y-6"> 
      <div> 
        <h1 className="text-2xl font-bold text-foreground">Consultar Análises</h1> 
        <p className="text-muted-foreground">Consulte e exporte o histórico completo</p> 
      </div> 
 
      <Card className="shadow-lg"> 
        <CardHeader> 
          <CardTitle className="flex items-center gap-2 text-base"> 
            <Search className="w-5 h-5 text-primary" /> 
            Filtros de Busca 
          </CardTitle> 
        </CardHeader> 
        <CardContent> 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"> 
            <div className="space-y-2"> 
              <Label>Fornecedor</Label> 
              <Select  
                value={filtros.fornecedor}  
                onValueChange={(value) => setFiltros(prev => ({ ...prev, fornecedor: value, propriedade: "" }))}  
              > 
                <SelectTrigger className="bg-input-background"> 
                  <SelectValue placeholder="Todos" /> 
                </SelectTrigger> 
                <SelectContent> 
                  <SelectItem value="todos">Todos</SelectItem> 
                  {fornecedores.map(f => ( 
                    <SelectItem key={f.idFornecedor} value={String(f.idFornecedor)}>{f.nome}</SelectItem> 
                  ))} 
                </SelectContent> 
              </Select> 
            </div> 
 
            <div className="space-y-2"> 
              <Label>Propriedade</Label> 
              <Select  
                value={filtros.propriedade}  
                onValueChange={(value) => setFiltros(prev => ({ ...prev, propriedade: value }))} 
                disabled={!filtros.fornecedor || filtros.fornecedor === "todos"} 
              > 
                <SelectTrigger className="bg-input-background"> 
                  <SelectValue placeholder="Todas" /> 
                </SelectTrigger> 
                <SelectContent> 
                  <SelectItem value="todas">Todas</SelectItem> 
                  {propriedades.map(p => ( 
                    <SelectItem key={p.idPropriedade} value={String(p.idPropriedade)}>{p.nome}</SelectItem> 
                  ))} 
                </SelectContent> 
              </Select> 
            </div> 
 
            <div className="space-y-2"> 
              <Label>Talhão</Label> 
              <Input 
                value={filtros.talhao} 
                onChange={(e) => setFiltros(prev => ({ ...prev, talhao: e.target.value }))} 
                placeholder="Ex: T-05" 
                className="bg-input-background" 
              /> 
            </div> 
 
            <div className="space-y-2"> 
              <Label>Data Início</Label> 
              <Input 
                type="date" 
                value={filtros.dataInicio} 
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))} 
                className="bg-input-background" 
              /> 
            </div> 
 
            <div className="space-y-2"> 
              <Label>Data Fim</Label> 
              <Input 
                type="date" 
                value={filtros.dataFim} 
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))} 
                className="bg-input-background" 
              /> 
            </div> 
          </div> 
 
          <div className="flex gap-2 mt-4 justify-end"> 
            <Button  
              onClick={handleLimparFiltros} 
              className="btn-calcana dark:hover:bg-green-400/30 dark:hover:text-green-400" 
              variant="outline"  
            > 
              Limpar 
            </Button> 
            <Button onClick={handleFiltrar} className="btn-calcana"> 
              <Search className="w-4 h-4 mr-2" /> 
              Filtrar Resultados 
            </Button> 
          </div> 
        </CardContent> 
      </Card> 
 
      <Card className="shadow-lg"> 
        <CardHeader> 
          <CardTitle className="flex items-center gap-2 text-base w-full"> 
            <History className="w-5 h-5 text-primary" /> 
            <span>Resultados ({totalElements} análises)</span> 
 
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}> 
              <DialogTrigger asChild> 
                <Button  
                  variant="outline"  
                  disabled={analises.length === 0} 
                  className="ml-auto flex items-center gap-2 border-green-600 bg-green-100 text-green-600 hover:bg-green-50 dark:bg-green-950 dark:hover:bg-green-400/30" 
                > 
                  <FileSpreadsheet className="w-4 h-4" /> 
                  Exportar Excel 
                </Button> 
              </DialogTrigger> 
 
              <DialogContent className="sm:max-w-md"> 
                <DialogHeader> 
                  <DialogTitle>Exportar Relatório Excel</DialogTitle> 
                  <DialogDescription> 
                    Escolha o layout desejado para o arquivo. 
                  </DialogDescription> 
                </DialogHeader> 
 
                <div className="grid grid-cols-1 gap-4 py-4"> 
                  <div  
                    onClick={() => setExportLayout("default")} 
                    className={cn( 
                      "cursor-pointer rounded-lg border-2 p-4 flex items-center justify-between transition-all", 
                      exportLayout === "default" ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/20" 
                    )} 
                  > 
                    <div className="flex items-center gap-3"> 
                      <FileSpreadsheet className="w-5 h-5 text-primary" /> 
                      <div className="flex flex-col"> 
                        <span className="font-medium">Padrão Calcana</span> 
                        <span className="text-xs text-muted-foreground">Relatório completo com todos os dados.</span> 
                      </div> 
                    </div> 
                    {exportLayout === "default" && <Check className="w-5 h-5 text-primary" />} 
                  </div> 
                  <div  
                    onClick={() => setExportLayout("nova_america")} 
                    className={cn( 
                      "cursor-pointer rounded-lg border-2 p-4 flex items-center justify-between transition-all", 
                      exportLayout === "nova_america" ? "border-primary bg-primary/5" :"border-muted hover:bg-muted/20" 
                    )} 
                  > 
                    <div className="flex items-center gap-3"> 
                      <FileText className="w-5 h-5 text-primary" /> 
                      <div className="flex flex-col"> 
                        <span className="font-medium">Nova América</span> 
                        <span className="text-xs text-muted-foreground">Sequência, Código, Zona e Talhão.</span> 
                      </div> 
                    </div> 
                    {exportLayout === "nova_america" && <Check className="w-5 h-5 text-primary" />} 
                  </div> 
                  <div  
                    onClick={() => setExportLayout("agroterenas")} 
                    className={cn( 
                      "cursor-pointer rounded-lg border-2 p-4 flex items-center justify-between transition-all", 
                      exportLayout === "agroterenas" ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/20" 
                    )} 
                  > 
                    <div className="flex items-center gap-3"> 
                      <FileText className="w-5 h-5 text-primary" /> 
                      <div className="flex flex-col"> 
                        <span className="font-medium">Agroterenas</span> 
                        <span className="text-xs text-muted-foreground">Sequência, Zona e Talhão.</span> 
                      </div> 
                    </div> 
                    {exportLayout === "agroterenas" && <Check className="w-5 h-5 text-primary"/>} 
                  </div> 
                </div> 
 
                <DialogFooter className="sm:justify-end gap-2"> 
                  <Button type="button" variant="outline" onClick={() => setIsExportDialogOpen(false)}> 
                    Cancelar 
                  </Button> 
                  <Button  
                    type="button"  
                    className="btn-calcana" 
                    onClick={handleConfirmExport} 
                    disabled={isExporting} 
                  > 
                    <Download className="w-4 h-4 mr-2" /> 
                    {isExporting ? "Gerando..." : "Gerar Arquivo"} 
                  </Button> 
                </DialogFooter> 
              </DialogContent> 
            </Dialog> 
 
          </CardTitle> 
        </CardHeader> 
        <CardContent> 
          <div className={cn("transition-opacity", loading ? "opacity-50" : "opacity-100")}> 
            <Table> 
              <TableHeader> 
                <TableRow> 
                  <TableHead>Data</TableHead> 
                  <TableHead>Nº Amostra</TableHead> 
                  <TableHead>Fornecedor</TableHead> 
                  <TableHead>Propriedade</TableHead> 
                  <TableHead>Talhão</TableHead> 
                  <TableHead>ATR</TableHead> 
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Ações</TableHead> 
                </TableRow> 
              </TableHeader> 
              <TableBody> 
                {loading && analises.length === 0 ? ( 
                  <TableRow> 
                    <TableCell colSpan={8} className="text-center py-4"> 
                      <Skeleton className="h-10 w-full" /> 
                    </TableCell> 
                  </TableRow> 
                ) : analises.length === 0 ? ( 
                  <TableRow> 
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground"> 
                      Nenhuma análise encontrada com os filtros atuais. 
                    </TableCell> 
                  </TableRow> 
                ) : ( 
                  analises.map((analise) => ( 
                    <TableRow key={analise.idAnalise}> 
                      <TableCell> 
                        <div className="flex items-center gap-2"> 
                          <Calendar className="w-4 h-4 text-muted-foreground" /> 
                          {new Date(analise.dataAnalise + 'T12:00:00').toLocaleDateString('pt-BR')} 
                        </div> 
                      </TableCell> 
                      <TableCell> 
                        <Badge variant="outline">#{analise.numeroAmostra}</Badge> 
                      </TableCell> 
                      <TableCell className="font-medium">{analise.propriedade.fornecedor.nome}</TableCell> 
                      <TableCell>{analise.propriedade.nome}</TableCell> 
                      <TableCell>{analise.talhao}</TableCell> 
                      <TableCell> 
                        <span className={`font-bold ${getATRColor(analise.atr)}`}> 
                          {analise.atr ? analise.atr.toFixed(2) : "-"} 
                        </span> 
                      </TableCell> 
                      <TableCell> 
                        {analise.statusEnvioEmail ? ( 
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800"> 
                            <Check className="w-3 h-3 mr-1" /> 
                            Enviado 
                          </Badge> 
                        ) : ( 
                          <Badge variant="outline">Pendente</Badge> 
                        )} 
                      </TableCell> 
                      <TableCell className="text-right"> 
                        <div className="flex justify-end gap-2"> 
 
                          {userRole === "OPERADOR" && ( 
                            <Button  
                              variant="outline"  
                              size="sm"  
                              title="Enviar por E-mail" 
                              onClick={() => handleSendEmailClick(analise)}
                              className="text-card-foreground hover:text-green-700 border-gray-200 hover:bg-green-100" 
                              disabled={sendingEmailId === analise.idAnalise} 
                            > 
                              <Send className={`w-4 h-4 ${sendingEmailId === analise.idAnalise ? 'animate-pulse text-green-500' : 'text-muted-foreground:'}`} /> 
                            </Button> 
                          )} 
 
                          <Button  
                            variant="outline"  
                            size="sm"  
                            title="Baixar Boletim PDF" 
                            onClick={() => baixarBoletimPDF(analise.idAnalise, analise.numeroAmostra)} 
                            className=" hover:text-blue-700 border-gray-200 hover:bg-blue-100" 
                          > 
                            <FileDown className="w-4 h-4 text-blue-600" /> 
                          </Button> 
 
                          <Dialog> 
                            <DialogTrigger asChild> 
                              <Button  
                                variant="outline"  
                                size="sm" 
                                title="Ver Detalhes" 
                                onClick={() => setAnaliseDetalhada(analise)} 
                                className="text-card-foreground border-gray-200 hover:bg-gray-50" 
                              > 
                                <Eye className="w-4 h-4 text-muted-foreground" /> 
                              </Button> 
                            </DialogTrigger> 
                            <DialogContent className="max-w-2xl"> 
                              <DialogHeader> 
                                <DialogTitle className="flex items-center gap-2"> 
                                  <TestTube className="w-5 h-5 text-primary" /> 
                                  Detalhes da Análise #{analiseDetalhada?.numeroAmostra} 
                                </DialogTitle> 
                                <DialogDescription> 
                                  Dados completos da amostra. 
                                </DialogDescription> 
                              </DialogHeader> 
 
                              {analiseDetalhada && ( 
                                <div className="space-y-4"> 
                                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg"> 
                                    <div> 
                                      <Label className="text-xs text-muted-foreground">Lançado por</Label> 
                                      <p>{analiseDetalhada.usuarioLancamento.nome}</p> 
                                    </div> 
                                    <div> 
                                      <Label className="text-xs text-muted-foreground">Zona / Corte</Label> 
                                      <p>{analiseDetalhada.zona} - {analiseDetalhada.corte}º Corte</p> 
                                    </div> 
                                  </div> 
 
                                  <Separator /> 
 
                                  <div> 
                                    <h3 className="font-medium mb-2 text-sm uppercase text-muted-foreground">Dados de Entrada</h3> 
                                    <div className="grid grid-cols-3 gap-3 text-sm"> 
                                      <div className="p-2 border rounded text-center"> 
                                        <span className="block text-xs text-muted-foreground">PBU</span> 
                                        <span className="font-bold">{analiseDetalhada.pbu.toFixed(2)}</span> 
                                      </div> 
                                      <div className="p-2 border rounded text-center"> 
                                        <span className="block text-xs text-muted-foreground">Brix</span> 
                                        <span className="font-bold">{analiseDetalhada.brix.toFixed(2)}</span> 
                                      </div> 
                                      <div className="p-2 border rounded text-center"> 
                                        <span className="block text-xs text-muted-foreground">Leitura</span> 
                                        <span className="font-bold">{analiseDetalhada.leituraSacarimetrica.toFixed(2)}</span> 
                                      </div> 
                                    </div> 
                                  </div> 
 
                                  <div> 
                                    <h3 className="font-medium mb-2 text-sm uppercase text-muted-foreground">Resultados</h3> 
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm"> 
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Pureza:</span> 
                                        <span>{analiseDetalhada.pureza.toFixed(2)}%</span>
                                      </div> 
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Pol (Cana):</span> 
                                        <span>{analiseDetalhada.polCana.toFixed(2)}%</span>
                                      </div> 
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Fibra:</span> 
                                        <span>{analiseDetalhada.fibra.toFixed(2)}%</span>
                                      </div> 
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">AR (Cana):</span> 
                                        <span>{analiseDetalhada.arCana.toFixed(2)}%</span>
                                      </div> 
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">AR (Caldo):</span> 
                                        <span>{analiseDetalhada.arCaldo.toFixed(2)}%</span>
                                      </div> 
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Pol (Caldo):</span>
                                        <span>{analiseDetalhada.polCaldo.toFixed(2)}%</span>
                                      </div> 
                                    </div> 
 
                                    <div className="mt-4 bg-primary/10 p-3 rounded-lg flex justify-between items-center"> 
                                      <span className="font-bold text-primary">ATR Final</span> 
                                      <span className="text-xl font-bold text-primary">{analiseDetalhada.atr.toFixed(2)}</span> 
                                    </div> 
                                  </div> 
 
                                  {analiseDetalhada.observacoes && ( 
                                    <div className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-100 dark:border-yellow-900/50"> 
                                      <span className="font-medium text-yellow-800 dark:text-yellow-500">Observações: </span> 
                                      <span className="text-yellow-800 dark:text-yellow-500">{analiseDetalhada.observacoes}</span> 
                                    </div> 
                                  )} 
                                </div> 
                              )} 
                            </DialogContent> 
                          </Dialog> 
                        </div> 
                      </TableCell> 
                    </TableRow> 
                  )) 
                )} 
              </TableBody> 
            </Table> 
          </div> 
 
        </CardContent> 
 
            <div className="mb-4 -mt-2 p-3 bg-muted/50 rounded-lg"> 
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"> 
                <span className="font-medium text-muted-foreground pl-4">Legenda ATR:</span> 
 
                <div className="flex items-center gap-2"> 
                  <Badge variant="default" className="px-2.5 py-0.5"> 
                    ≥ 150 
                  </Badge> 
                  <span className="text-muted-foreground text-xs">Excelente</span> 
                </div> 
 
                <div className="flex items-center gap-2"> 
                  <Badge className="px-2.5 py-0.5 bg-yellow-500"> 
                    140 - 149.9 
                  </Badge> 
                  <span className="text-muted-foreground text-xs">Bom</span> 
                </div> 
 
                <div className="flex items-center gap-2"> 
                  <Badge variant="destructive" className="px-2.5 py-0.5"> 
                    {"<"} 140 
                  </Badge> 
                  <span className="text-muted-foreground text-xs">Abaixo do esperado</span> 
                </div> 
              </div> 
            </div> 
 
        {totalPages > 1 && ( 
          <CardFooter className="flex items-center justify-between pt-4 border-t"> 
 
            <span className="text-sm text-muted-foreground"> 
              Página {currentPage + 1} de {totalPages} ({totalElements} registos) 
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
 
      <AlertDialog open={isSendAlertOpen} onOpenChange={setIsSendAlertOpen}> 
        <AlertDialogContent> 
          <AlertDialogHeader> 
            <AlertDialogTitle className="flex items-center gap-2"> 
                <AlertCircle className={analiseParaEnviar?.statusEnvioEmail ? "text-yellow-600" : "text-primary"} /> 
                {analiseParaEnviar?.statusEnvioEmail ? "Reenviar Boletim?" : "Enviar Boletim?"} 
            </AlertDialogTitle> 
            <AlertDialogDescription> 
              {analiseParaEnviar?.statusEnvioEmail ? ( 
                <> 
                  Este boletim (Amostra <strong>#{analiseParaEnviar.numeroAmostra}</strong>) já foi enviado.  
                  <br /> 
                  Deseja enviá-lo novamente para o e-mail do fornecedor? 
                </> 
              ) : ( 
                <> 
                  Deseja enviar o boletim da Amostra <strong>#{analiseParaEnviar?.numeroAmostra}</strong> por e-mail para o fornecedor? 
                </> 
              )} 
            </AlertDialogDescription> 
          </AlertDialogHeader> 
          <AlertDialogFooter> 
            <AlertDialogCancel onClick={() => setAnaliseParaEnviar(null)}>Cancelar</AlertDialogCancel> 
            <AlertDialogAction onClick={confirmSendEmail} className="btn-calcana"> 
              {analiseParaEnviar?.statusEnvioEmail ? "Sim, Reenviar" : "Sim, Enviar"} 
            </AlertDialogAction> 
          </AlertDialogFooter> 
        </AlertDialogContent> 
      </AlertDialog>  
    </div> 
  ); 
} 