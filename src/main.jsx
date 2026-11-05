import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './supabase'
const LOGO = `${import.meta.env.BASE_URL}WhatsApp Image 2026-10-07 at 16.16.10.jpeg`
const ZAP_LOGO = `${import.meta.env.BASE_URL}zap.jpg`
const LogoMark = ({className=''}) => (
  <img className={className} src={LOGO} alt="Central Truck Service" />
)
import './style.css'

const MENU = [
  ['dashboard', '▦', 'Dashboard'],
  ['empresas', '▣', 'Empresas / Leads'],
  ['funil', '◫', 'Funil Comercial'],
  ['oportunidades', '◆', 'Oportunidades'],
  ['atendimentos', '☎', 'Atendimentos'],
  ['agenda', '▤', 'Agenda'],
  ['orcamentos', 'R$', 'Orçamentos'],
  ['ordens-servico', '▤', 'Ordens de Serviço'],
  ['catalogo', '▣', 'Cadastrar Produtos e Serviços'],
  ['relatorios', '▥', 'Relatórios'],
  ['importar', '⇩', 'Importar Contatos'],
  ['configuracoes', '⚙', 'Configurações'],
]

const normalizarBusca = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const dinheiro = (valor = 0) =>
  Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

const dataBR = (data) => {
  if (!data) return '—'
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

function Card({ titulo, valor, detalhe }) {
  return (
    <div className="card">
      <span>{titulo}</span>
      <strong>{valor}</strong>
      {detalhe && <small>{detalhe}</small>}
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [authCarregando, setAuthCarregando] = useState(true)
  const [emailLogin, setEmailLogin] = useState('')
  const [senhaLogin, setSenhaLogin] = useState('')
  const [erroLogin, setErroLogin] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [pagina, setPagina] = useState(() => {
    const paginaSalva = localStorage.getItem('centraltruck_pagina') || sessionStorage.getItem('centraltruck_pagina')
    return MENU.some(([id]) => id === paginaSalva) ? paginaSalva : 'dashboard'
  })
  useEffect(() => {
    localStorage.setItem('centraltruck_pagina', pagina)
  }, [pagina])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [empresas, setEmpresas] = useState([])
  const [contatos, setContatos] = useState([])
  const [oportunidades, setOportunidades] = useState([])
  const [atividades, setAtividades] = useState([])
  const [tarefas, setTarefas] = useState([])
  const [orcamentos, setOrcamentos] = useState([])
  // Recarrega os indicadores ao voltar ao Dashboard e ao retornar para a aba do CRM.
  useEffect(() => {
    if (session && pagina === 'dashboard') carregarDados()
  }, [pagina, session?.user?.id])
  useEffect(() => {
    const atualizarAoVoltar = () => {
      if (document.visibilityState === 'visible' && session && pagina === 'dashboard') carregarDados()
    }
    document.addEventListener('visibilitychange', atualizarAoVoltar)
    return () => document.removeEventListener('visibilitychange', atualizarAoVoltar)
  }, [pagina, session?.user?.id])


  async function carregarDados() {
    setCarregando(true)
    setErro('')

    try {
      const [
        empresasRes,
        contatosRes,
        oportunidadesRes,
        atividadesRes,
        tarefasRes,
        orcamentosRes,
      ] = await Promise.all([
        supabase.from('empresas').select('*').order('criado_em', {
          ascending: false,
        }),
        supabase.from('contatos').select('*').order('criado_em', {
          ascending: false,
        }),
        supabase.from('oportunidades').select('*').order('criado_em', {
          ascending: false,
        }),
        supabase.from('atividades').select('*').order('data_atividade', {
          ascending: false,
        }),
        supabase.from('tarefas').select('*').order('data_hora', {
          ascending: true,
        }),
        supabase.from('orcamentos').select('*').order('criado_em', {
          ascending: false,
        }),
      ])

      const respostas = [
        empresasRes,
        contatosRes,
        oportunidadesRes,
        atividadesRes,
        tarefasRes,
        orcamentosRes,
      ]

      const falha = respostas.find((r) => r.error)
      if (falha) throw falha.error

      setEmpresas(empresasRes.data || [])
      setContatos(contatosRes.data || [])
      setOportunidades(oportunidadesRes.data || [])
      setAtividades(atividadesRes.data || [])
      setTarefas(tarefasRes.data || [])
      setOrcamentos(orcamentosRes.data || [])
    } catch (e) {
      console.error(e)
      setErro(e?.message || 'Não foi possível carregar os dados do Supabase.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    let ativo = true
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return
      setSession(data.session)
      setAuthCarregando(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, novaSession) => {
      setSession(novaSession)
      setAuthCarregando(false)
    })
    return () => {
      ativo = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) carregarDados()
    else setCarregando(false)
  }, [session])

  async function entrar(e) {
    e.preventDefault()
    setEntrando(true)
    setErroLogin('')
    const { error } = await supabase.auth.signInWithPassword({
      email: emailLogin.trim(),
      password: senhaLogin,
    })
    if (error) setErroLogin('E-mail ou senha inválidos.')
    setEntrando(false)
  }

  async function sair() {
    await supabase.auth.signOut()
    setSession(null)
    setEmpresas([])
    setContatos([])
    setOportunidades([])
    setAtividades([])
    setTarefas([])
    setOrcamentos([])
  }

  if (authCarregando) {
    return <div className="auth-screen"><div className="auth-card"><b>Central Truck CRM</b><p>Verificando acesso...</p></div></div>
  }

  if (!session) {
    return (
      <div className="auth-screen">
        <form className="auth-card" onSubmit={entrar}>
          <LogoMark className="auth-brand-logo" />
          <h1>Central Truck CRM</h1>
          <p>Acesso restrito à equipe autorizada.</p>
          <label>E-mail<input type="email" value={emailLogin} onChange={(e)=>setEmailLogin(e.target.value)} required autoComplete="email" /></label>
          <label>Senha<input type="password" value={senhaLogin} onChange={(e)=>setSenhaLogin(e.target.value)} required autoComplete="current-password" /></label>
          {erroLogin && <div className="auth-error">{erroLogin}</div>}
          <button className="primary" type="submit" disabled={entrando}>{entrando ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    )
  }

  const leadsA = empresas.filter((e) => e.classificacao === 'A').length
  const leadsB = empresas.filter((e) => e.classificacao === 'B').length
  const leadsC = empresas.filter((e) => e.classificacao === 'C').length

  // Dashboard de vendas baseado nos orçamentos, sem duplicar oportunidades vinculadas.
  const vendas = orcamentos.filter(o => String(o.status || '').trim().toLowerCase() === 'finalizado')
  const negociacoes = orcamentos.filter(o => ['em negociação', 'enviado', 'visualizado'].includes(String(o.status || '').trim().toLowerCase()))
  const valorOportunidades = orcamentos
    .filter(o => ['rascunho', 'enviado', 'visualizado', 'em negociação', 'aprovado'].includes(String(o.status || '').trim().toLowerCase()))
    .reduce((total,o) => total + Number(o.valor || 0), 0)
  const valorVendido = vendas.reduce((total,o) => total + Number(o.valor || 0), 0)
  const conversao = orcamentos.length
    ? ((vendas.length / orcamentos.length) * 100).toFixed(1)
    : '0.0'

  const atrasadas = tarefas.filter((t) => {
    if (!t.data_hora || t.status === 'Concluída') return false
    return new Date(t.data_hora) < new Date()
  }).length

  function nomeEmpresa(id) {
    return (
      empresas.find((empresa) => empresa.id === id)?.nome_fantasia ||
      empresas.find((empresa) => empresa.id === id)?.nome ||
      'Empresa'
    )
  }

  function linkLembreteWhatsApp(empresaId, assunto, descricao, dataHora) {
    const empresa = empresas.find((x) => String(x.id) === String(empresaId))
    const numeroBruto = empresa?.whatsapp || empresa?.telefone || ''
    const numero = String(numeroBruto).replace(/[^0-9]/g, '')
    if (!numero) return ''
    const destino = numero.startsWith('55') ? numero : '55' + numero
    const data = dataHora ? new Date(dataHora) : null
    const quando = data && !Number.isNaN(data.getTime()) ? data.toLocaleString('pt-BR') : 'a combinar'
    const mensagem = 'Olá! Aqui é a Central Truck Service.\n\nLembrete: ' + (assunto || 'Atendimento') + '\nData/Hora: ' + quando + (descricao ? '\nObservação: ' + descricao : '') + '\n\nQualquer dúvida, estamos à disposição.'
    return 'https://wa.me/' + destino + '?text=' + encodeURIComponent(mensagem)
  }

  function Dashboard() {
    const limiteUltimos30Dias = new Date()
    limiteUltimos30Dias.setDate(limiteUltimos30Dias.getDate() - 30)
    const vendasUltimos30Dias = vendas.filter(o => {
      const data = o.finalizado_em || o.data_finalizacao || o.atualizado_em || o.criado_em
      return data && !Number.isNaN(new Date(data).getTime()) && new Date(data) >= limiteUltimos30Dias
    })
    const valorUltimos30Dias = vendasUltimos30Dias.reduce((total,o)=>total+Number(o.valor||0),0)
    const ultimosLeads = empresas.slice(0, 4)
    const proximasTarefas = tarefas
      .filter((t) => t.status !== 'Concluída')
      .sort((a,b) => new Date(a.data_hora) - new Date(b.data_hora))
      .slice(0, 4)
    const kpis = [
      ['◎','Total de Leads', empresas.length],
      ['◇','Em Negociação', negociacoes.length],
      ['▥','Vendas Realizadas', vendas.length],
      ['▥','Vendas nos Últimos 30 Dias', vendasUltimos30Dias.length],
      ['R$','Valor Vendido nos Últimos 30 Dias', dinheiro(valorUltimos30Dias)],
      ['R$','Valor em Oportunidades', dinheiro(valorOportunidades)],
      ['↗','Valor Vendido', dinheiro(valorVendido)],
      ['%','Conversão', `${conversao}%`],
      ['◷','Retornos Atrasados', atrasadas],
    ]
    return (
      <div className="dashboard-premium">
        <section className="dash-hero">
          <div>
            <small>Central Truck Service</small>
            <h1>Dashboard Comercial</h1>
            <p>Visão geral da operação comercial Truck exclusivo Danielle</p>
            <button className="primary" onClick={carregarDados}>↻ Atualizar dados</button>
          </div>
          <div className="hero-watermark hero-driving-scene"><img className="hero-truck-image" src={`${import.meta.env.BASE_URL}Caminhão Volvo FH 540 no Galpão Industrial.png`} alt="Volvo FH 540 em movimento" /><span className="truck-motion-streak streak-one" aria-hidden="true"></span><span className="truck-motion-streak streak-two" aria-hidden="true"></span><span className="truck-motion-streak streak-three" aria-hidden="true"></span></div>
        </section>

        <section className="kpi-grid">
          {kpis.map(([icone,titulo,valor]) => (
            <div className="kpi-card clickable-card" key={titulo} role="button" tabIndex="0" onClick={() => { const destinos={'Total de Leads':'empresas','Em Negociação':'funil','Vendas Realizadas':'orcamentos','Vendas nos Últimos 30 Dias':'orcamentos','Valor Vendido nos Últimos 30 Dias':'orcamentos','Valor em Oportunidades':'orcamentos','Valor Vendido':'orcamentos','Conversão':'relatorios','Retornos Atrasados':'agenda'}; setPagina(destinos[titulo] || 'dashboard') }} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')e.currentTarget.click()}}>
              <div className="kpi-icon">{icone}</div>
              <span>{titulo}</span>
              <strong>{valor}</strong>
              <small><b>Central Truck</b> · atualizado</small>
            </div>
          ))}
        </section>

        <div className="dashboard-lower">
          <section className="panel strategic-panel clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('oportunidades')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('oportunidades')}}>
            <div className="panel-heading"><div><h2>Serviços Estratégicos</h2><p>Principais soluções oferecidas pela Central Truck.</p></div></div>
            <div className="service-premium-grid">
              <img
                className="strategic-services-image"
                src={`${import.meta.env.BASE_URL}servicos-estrategicos.jpg`}
                alt="Serviços Estratégicos da Central Truck"
              />
            </div>
          </section>
          <section className="panel commercial-chart clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('relatorios')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('relatorios')}}>
            <div className="panel-heading"><div><h2>Resumo Comercial</h2><p>Evolução das vendas e oportunidades.</p></div></div>
            <div className="mini-bars">
              <div><span>Leads</span><i style={{height:`${Math.min(100,Math.max(8,empresas.length*12))}%`}}></i><b>{empresas.length}</b></div>
              <div><span>Oportunidades</span><i style={{height:`${Math.min(100,Math.max(8,oportunidades.length*16))}%`}}></i><b>{oportunidades.length}</b></div>
              <div><span>Vendas finalizadas</span><i style={{height:`${Math.min(100,Math.max(8,vendas.length*22))}%`}}></i><b>{vendas.length}</b></div>
              <div><span>Orçamentos</span><i style={{height:`${Math.min(100,Math.max(8,orcamentos.length*18))}%`}}></i><b>{orcamentos.length}</b></div>
            </div>
          </section>
        </div>

        <div className="dashboard-lower">
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Últimos Leads</h2><p>Empresas cadastradas recentemente.</p></div><button onClick={()=>setPagina('empresas')}>Ver todos →</button></div>
            {ultimosLeads.length ? ultimosLeads.map((e)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={e.id} onClick={()=>setPagina('empresas')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('empresas')}}><span className="list-avatar">{(e.nome_fantasia||e.nome||'C')[0]}</span><div><b>{e.nome_fantasia||e.nome}</b><small>{e.status||'Lead novo'}</small></div><em>{e.classificacao||'B'}</em></div>) : <div className="dash-empty">Nenhum lead cadastrado.</div>}
          </section>
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Agenda vinculada</h2><p>{tarefas.length} tarefa(s) cadastrada(s) • {proximasTarefas.length} próxima(s) exibida(s).</p></div><button onClick={()=>setPagina('agenda')}>Ver agenda →</button></div>
            {proximasTarefas.length ? proximasTarefas.map((t)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={t.id} onClick={()=>setPagina('agenda')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('agenda')}}><span className="list-avatar">◷</span><div><b>{t.titulo}</b><small>{nomeEmpresa(t.empresa_id)} · {dataBR(t.data_hora)}</small></div><em>{t.prioridade||'Normal'}</em></div>) : <div className="dash-empty">Nenhuma tarefa encontrada no banco de dados. Abra a Agenda para cadastrar ou atualizar.</div>}
          </section>
        </div>
      </div>
    )
  }

 async function baixarPlanilhaClientes() {
  if (!empresas.length) { alert('Não há clientes cadastrados para baixar.'); return }

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Central Truck Service'
  workbook.created = new Date()
  const ws = workbook.addWorksheet('Clientes', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
    },
    views: [{ state: 'frozen', ySplit: 6 }]
  })

  const colunas = [
    ['Empresa',28],['Nome fantasia',28],['CNPJ',20],['Classificação',14],
    ['Segmento',20],['Cidade',20],['Estado',10],['Telefone',18],
    ['WhatsApp',18],['E-mail',30],['Site',28],['Status',20],
    ['Data do cadastro',18],['Observações',40]
  ]
  ws.columns = colunas.map(([header,width]) => ({ header, width }))
  ws.spliceRows(1, 1)
  ws.mergeCells('A1:N3')
  ws.mergeCells('A4:N4')
  ws.mergeCells('A5:N5')
  ws.getCell('A1').value = 'CENTRAL TRUCK SERVICE'
  ws.getCell('A4').value = 'RELATÓRIO DE CLIENTES / LEADS'
  ws.getCell('A5').value = 'Gestão Comercial • Exportado em ' + new Date().toLocaleString('pt-BR')

  const verde = 'FF19E6A2', escuro = 'FF061914', escuro2 = 'FF0B2A21', branco = 'FFFFFFFF', cinza = 'FFDCE9E4'
  ;['A1','A4','A5'].forEach((ref) => {
    ws.getCell(ref).alignment = { vertical:'middle', horizontal:'center' }
    ws.getCell(ref).fill = { type:'pattern', pattern:'solid', fgColor:{argb:escuro} }
    ws.getCell(ref).font = { color:{argb: ref==='A4' ? verde : branco}, bold:true, size: ref==='A1' ? 24 : ref==='A4' ? 16 : 10 }
  })
  ws.getRow(1).height = 32; ws.getRow(2).height = 18; ws.getRow(3).height = 18
  ws.getRow(4).height = 26; ws.getRow(5).height = 22

  const headerRow = ws.getRow(6)
  colunas.forEach(([titulo],i) => headerRow.getCell(i+1).value = titulo)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:verde} }
    cell.font = { color:{argb:'FF00140E'}, bold:true, size:10 }
    cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true }
    cell.border = { bottom:{style:'medium',color:{argb:'FF00A875'}} }
  })

  empresas.forEach((empresa,idx) => {
    const row = ws.addRow([
      empresa.nome || '', empresa.nome_fantasia || '', empresa.cnpj || '',
      empresa.classificacao || '', empresa.segmento || '', empresa.cidade || '',
      empresa.estado || '', empresa.telefone || '', empresa.whatsapp || '',
      empresa.email || '', empresa.site || '', empresa.status || '',
      dataBR(empresa.criado_em), empresa.observacoes || ''
    ])
    row.height = 24
    row.eachCell({includeEmpty:true}, (cell) => {
      cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb: idx%2===0 ? 'FFF5FAF8' : branco} }
      cell.font = { color:{argb:'FF17352C'}, size:10 }
      cell.alignment = { vertical:'middle', wrapText:true }
      cell.border = { bottom:{style:'thin',color:{argb:cinza}} }
    })
  })

  ws.autoFilter = { from:'A6', to:'N' + (empresas.length + 6) }
  ws.headerFooter.oddHeader = '&C&B CENTRAL TRUCK SERVICE'
  ws.headerFooter.oddFooter = '&LRelatório de Clientes&CConfidencial&R&P de &N'
  ws.pageSetup.printTitlesRow = '1:6'
  ws.pageSetup.printArea = 'A1:N' + (empresas.length + 6)

  try {
    const resposta = await fetch(LOGO)
    const blob = await resposta.blob()
    const base64 = await new Promise((resolve,reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const ext = blob.type.includes('png') ? 'png' : 'jpeg'
    const logoId = workbook.addImage({ base64, extension:ext })
    ws.addImage(logoId, { tl:{col:0.15,row:0.15}, ext:{width:125,height:72}, editAs:'oneCell' })
  } catch (e) { console.warn('Logo não inserida no Excel:', e) }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'Clientes_Central_Truck_' + new Date().toISOString().slice(0,10) + '.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

function Empresas() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const formularioEmpresaRef = React.useRef(null)
  const [salvando, setSalvando] = useState(false)
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
   const [empresaEditando, setEmpresaEditando] = useState(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState([])
  const [buscaEmpresa, setBuscaEmpresa] = useState('')
  const [filtroStatusEmpresa, setFiltroStatusEmpresa] = useState('')
  const [buscaAgenda, setBuscaAgenda] = useState('')
  const [form, setForm] = useState({
    nome: '',
    nome_fantasia: '',
    pessoa_contato: '',
    cnpj: '',
    segmento: '',
    classificacao: 'B',
    status: 'Lead novo',
    cidade: '',
    estado: 'MG',
    telefone: '',
    whatsapp: '',
    email: '',
    site: '',
    observacoes: ''
  })

  function limparCadastro() {
    sessionStorage.removeItem('empresa_rascunho')
    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    setEmpresaEditando(null)
    setForm({
      nome: '', nome_fantasia: '', pessoa_contato: '', cnpj: '',
      segmento: '', classificacao: 'B', status: 'Lead novo',
      cidade: '', estado: 'MG', telefone: '', whatsapp: '',
      email: '', site: '', observacoes: ''
    })
  }

  useEffect(() => {
    const rascunho = sessionStorage.getItem('centraltruck_empresa_em_edicao')
    if (rascunho) {
      try {
        const dados = JSON.parse(rascunho)
        if (dados && typeof dados === 'object') {
          setForm(dados)
          setMostrarFormulario(true)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (mostrarFormulario && !empresaEditando && form.nome.trim()) {
      sessionStorage.setItem('centraltruck_empresa_em_edicao', JSON.stringify(form))
    }
  }, [form, mostrarFormulario, empresaEditando])

  function alterarCampo(e) {
    const { name, value } = e.target
    setForm((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }
function editarEmpresa(empresa) {
  setEmpresaEditando(empresa)

  setForm({
    nome: empresa.nome || '',
    nome_fantasia: empresa.nome_fantasia || '',
    pessoa_contato: empresa.pessoa_contato || '',
    cnpj: empresa.cnpj || '',
    segmento: empresa.segmento === 'Diesel' ? 'Oficina - Diesel' : (empresa.segmento || ''),
    classificacao: empresa.classificacao || 'B',
    status: empresa.status || 'Lead novo',
    cidade: empresa.cidade || '',
    estado: empresa.estado || 'MG',
    telefone: empresa.telefone || '',
    whatsapp: empresa.whatsapp || '',
    email: empresa.email || '',
    site: empresa.site || '',
    observacoes: empresa.observacoes || ''
  })

  setMensagem('')
  setMostrarFormulario(true)
  requestAnimationFrame(() => {
    formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
async function excluirSelecionados() {
  if (!leadsSelecionados.length) {
    alert('Selecione pelo menos um Lead.')
    return
  }
  if (!window.confirm('Excluir os ' + leadsSelecionados.length + ' Leads selecionados?')) return

  const lote = 100
  for (let inicio = 0; inicio < leadsSelecionados.length; inicio += lote) {
    const ids = leadsSelecionados.slice(inicio, inicio + lote)

    const funil = await supabase.from('oportunidades').delete().in('empresa_id', ids)
    if (funil.error) {
      alert('Erro ao limpar os vínculos do Funil: ' + funil.error.message)
      await carregarDados()
      return
    }

    const resultado = await supabase.from('empresas').delete().in('id', ids)
    if (resultado.error) {
      alert('Erro ao excluir os Leads selecionados: ' + resultado.error.message)
      await carregarDados()
      return
    }
  }

  setLeadsSelecionados([])
  await carregarDados()
  alert('Leads selecionados excluídos com sucesso.')
}

async function excluirEmpresa(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir esta empresa? Esta ação não poderá ser desfeita.'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('Erro ao excluir empresa: ' + error.message)
    return
  }

  await carregarDados()
}
  async function salvarEmpresa(e) {
    e.preventDefault()

    if (!form.nome.trim()) {
      setMensagem('Informe o nome da empresa.')
      return
    }

    setSalvando(true)
    setMensagem('')

    const { pessoa_contato, ...camposBanco } = form
    const dados = {
      ...camposBanco,
      nome: form.nome.trim(),
      nome_fantasia: form.nome_fantasia.trim() || null,
      cnpj: form.cnpj.trim() || null,
      segmento: form.segmento.trim() || null,
      cidade: form.cidade.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      observacoes: form.observacoes.trim() || null
    }

    let resultado

if (empresaEditando) {
  resultado = await supabase
    .from('empresas')
    .update(dados)
    .eq('id', empresaEditando.id)
} else {
  resultado = await supabase
    .from('empresas')
    .insert([dados])
    .select('id')
}

const { error } = resultado


    if (error) {
      console.error(error)
      setMensagem('Erro ao cadastrar empresa: ' + error.message)
      setSalvando(false)
      return
    }

    setMensagem(empresaEditando ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!')
    sessionStorage.removeItem('empresa_rascunho')

    setForm({
      nome: '',
      nome_fantasia: '',
      pessoa_contato: '',
      cnpj: '',
      segmento: '',
      classificacao: 'B',
      status: 'Lead novo',
      cidade: '',
      estado: 'MG',
      telefone: '',
      whatsapp: '',
      email: '',
      site: '',
      observacoes: ''
    })

    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    await carregarDados()
    setSalvando(false)
    setEmpresaEditando(null)
    // Manter o formulario aberto e limpo para o proximo cadastro.
    setMostrarFormulario(true)
    requestAnimationFrame(() => {
      formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Empresas / Leads</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.4' }}>Base comercial de clientes e potenciais clientes.</p>
        </div>

        <button
          className="primary"
          onClick={() => {
            setMensagem('')
            if (mostrarFormulario) {
              setMostrarFormulario(false)
              limparCadastro()
            } else {
              limparCadastro()
              setMostrarFormulario(true)
            }
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nova Empresa'}
        </button>
        <button type="button" className="btn-exportar" onClick={baixarPlanilhaClientes}>
          ↓ Baixar planilha de clientes
        </button>
      </div>

      {mensagem && (
        <section className="panel" style={{ marginBottom: '16px' }}>
          <strong>{mensagem}</strong>
        </section>
      )}

      {mostrarFormulario && (
        <section ref={formularioEmpresaRef} className="panel" style={{ marginBottom: '20px', scrollMarginTop: '24px' }}>
          <h2>{empresaEditando ? 'Editar Empresa' : 'Nova Empresa'}</h2>

          <form onSubmit={salvarEmpresa}>
            <div className="form-grid">
              <label>
                Nome da empresa *
                <input
                  name="nome"
                  value={form.nome}
                  onChange={alterarCampo}
                  required
                />
              </label>

              <label>
                Pessoa de contato
                <input
                  name="pessoa_contato"
                  value={form.pessoa_contato}
                  onChange={alterarCampo}
                  placeholder="Ex.: Gustavo"
                />
              </label>

              <label>
                CNPJ
                <input
                  name="cnpj"
                  value={form.cnpj}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Segmento
                <select
                  name="segmento"
                  value={form.segmento}
                  onChange={alterarCampo}
                >
                  <option value="">Selecione o segmento</option>
                  <option value="Transportadora">Transportadora</option>
                  <option value="Frota Própria">Frota Própria</option>
                  <option value="Frota Terceirizada">Frota Terceirizada</option>
                  <option value="Troca de Óleo">Troca de Óleo</option>
                  <option value="Oficina - Diesel">Oficina - Diesel</option>
                  <option value="Elétrica">Elétrica</option>
                  <option value="Pessoa Física">Pessoa Física</option>
                </select>
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={alterarCampo}
                >
                  <option>Lead novo</option>
                  <option>Primeiro contato</option>
                  <option>Interessado</option>
                  <option>Visita agendada</option>
                  <option>Orçamento enviado</option>
                  <option>Em negociação</option>
                  <option>Venda realizada</option>
                  <option>Venda perdida</option>
                  <option>Pós-venda</option>
                  <option>Já é cliente</option>
                  <option>Concorrente</option>
                  <option>Futuro parceiro</option>
                  <option>Não atendeu, ligar novamente</option>
                  <option>Cliente de outro vendedor</option>
                  </select>
              </label>

              <label>
                Cidade
                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Estado
                <input
                  name="estado"
                  value={form.estado}
                  onChange={alterarCampo}
                  maxLength="2"
                />
              </label>

              <label>
                Telefone
                <input
                  name="telefone"
                  value={form.telefone}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                WhatsApp
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={alterarCampo}
                />
              </label>
            </div>

            <label style={{ display: 'block', marginTop: '14px' }}>
              Observações
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={alterarCampo}
                rows="4"
              />
            </label>

            <div style={{ marginTop: '12px', color: 'var(--muted)', fontSize: '13px' }}>Após salvar, você poderá selecionar esta empresa na seção “Agendar novo contato” abaixo.</div>
            <div style={{ marginTop: '16px' }}>
              <button
                className="primary"
                type="submit"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Empresa'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel" style={{ marginBottom: '16px' }}>
        <h3>Agendar novo contato</h3>
        <p>Selecione uma empresa cadastrada para criar um retorno diretamente na Agenda.</p>
        <input aria-label="Buscar empresa para agendar" placeholder="🔎 Buscar empresa pelo nome..." value={buscaAgenda} onChange={e => setBuscaAgenda(e.target.value)} style={{width:'100%',maxWidth:'480px',marginBottom:'8px'}} />
        <select id="empresa-agenda-rapida" defaultValue="" style={{ width: '100%', maxWidth: '480px', marginRight: '12px' }}>
          <option value="">Selecione uma empresa</option>
          {empresas.filter(empresa => normalizarBusca(empresa.nome_fantasia || empresa.nome).includes(normalizarBusca(buscaAgenda))).map(empresa => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia || empresa.nome}</option>)}
        </select>
        <button type="button" className="primary" style={{ background: '#444B54', backgroundColor: '#444B54', color: '#FFFFFF', border: '1px solid #626A74' }} onClick={() => {
          const id = document.getElementById('empresa-agenda-rapida')?.value
          if (!id) { alert('Selecione uma empresa antes de agendar.'); return }
          sessionStorage.setItem('centraltruck_agendar_empresa', id)
          setPagina('agenda')
        }}>+ Agendar novo contato</button>
      </section>

      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px'}}>
        <input aria-label="Buscar na lista de empresas" placeholder="🔎 Buscar cliente, telefone, cidade ou observações..." value={buscaEmpresa} onChange={e => setBuscaEmpresa(e.target.value)} style={{flex:'2 1 320px',minWidth:0}} />
        <select aria-label="Filtrar clientes por situação" value={filtroStatusEmpresa} onChange={e => setFiltroStatusEmpresa(e.target.value)} style={{flex:'1 1 220px',minWidth:0}}>
          <option value="">Todas as situações</option>
          <option value="Não atendeu, ligar novamente">Não atendeu / ligar novamente</option>
          {[...new Set(empresas.map(e => e.status).filter(Boolean))].filter(status => status !== 'Não atendeu, ligar novamente').sort((a,b)=>a.localeCompare(b,'pt-BR')).map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        {(buscaEmpresa || filtroStatusEmpresa) && <button type="button" onClick={()=>{setBuscaEmpresa('');setFiltroStatusEmpresa('')}}>Limpar filtros</button>}
      </div>
      <section className="panel table-wrap">
        {leadsSelecionados.length > 0 && (
          <div className="selection-toolbar">
            <strong>{leadsSelecionados.length} selecionado(s)</strong>
            <button type="button" className="btn-excluir" onClick={excluirSelecionados}>Excluir selecionados</button>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th className="select-col"><input type="checkbox" aria-label="Selecionar todos" checked={empresas.length > 0 && leadsSelecionados.length === empresas.length} onChange={(e)=>setLeadsSelecionados(e.target.checked ? empresas.map((item)=>item.id) : [])} /></th>
              <th>Empresa</th>
              <th>Segmento</th>
              <th>Cidade</th>
              <th>Telefone</th>
              <th>Status</th><th>Data do cadastro</th><th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {empresas.length > 0 ? (
              empresas.filter(empresa => (!filtroStatusEmpresa || empresa.status === filtroStatusEmpresa) && normalizarBusca([empresa.nome, empresa.nome_fantasia, empresa.telefone, empresa.whatsapp, empresa.cidade, empresa.segmento, empresa.status, empresa.pessoa_contato, empresa.observacoes].join(' ')).includes(normalizarBusca(buscaEmpresa))).map((empresa) => (
                <tr key={empresa.id}>
                  <td className="select-col"><input type="checkbox" aria-label={'Selecionar ' + (empresa.nome_fantasia || empresa.nome)} checked={leadsSelecionados.includes(empresa.id)} onChange={(e)=>setLeadsSelecionados((atuais)=>e.target.checked ? [...atuais, empresa.id] : atuais.filter((id)=>id !== empresa.id))} /></td>
                  <td>{empresa.nome}</td>
                  <td>{empresa.segmento || '-'}</td>
                  <td>
                    {empresa.cidade || '-'}
                    {empresa.estado ? ` / ${empresa.estado}` : ''}
                  </td>
                  <td>{empresa.telefone || empresa.whatsapp || '-'}</td>
                 <td>{empresa.status || '-'}</td>
<td>{dataBR(empresa.criado_em)}</td>
<td>
 
  <button
    type="button"
    onClick={() => editarEmpresa(empresa)}
    className="btn-editar"
  >
    Editar
  </button>

  <button
    type="button"
    onClick={() => excluirEmpresa(empresa.id)}
    className="btn-excluir"
  >
    Excluir
  </button>
</td>
                </tr>
              ))
            ) : (
              <tr>
<td colSpan="8" style={{ textAlign: 'center' }}>                 
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}

function Decisores() {
  const [contatos, setContatos] = useState([])
const [empresas, setEmpresas] = useState([])
const [mostrarFormDecisor, setMostrarFormDecisor] = useState(false)
const [salvandoDecisor, setSalvandoDecisor] = useState(false)
const [mensagemDecisor, setMensagemDecisor] = useState('')
    const [decisorEditandoId, setDecisorEditandoId] = useState(null)

const [formDecisor, setFormDecisor] = useState({
  empresa_id: '',
  nome: '',
  cargo: '',
  telefone: '',
  whatsapp: '',
  email: ''
})

    async function carregarDecisores() {
    const { data, error } = await supabase
      .from('contatos')
      .select(`
        *,
        empresas (
          nome
        )
      `)
      .order('nome')

    if (error) {
      console.error('Erro ao carregar decisores:', error)
      return
    }

    setContatos(data || [])
  }

  async function carregarEmpresasDecisor() {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome')
      .order('nome')

    if (error) {
      console.error('Erro ao carregar empresas:', error)
      return
    }

    setEmpresas(data || [])
  }

  useEffect(() => {
    carregarDecisores()
    carregarEmpresasDecisor()
  }, [])
    async function salvarDecisor(e) {
    e.preventDefault()
    setSalvandoDecisor(true)
    setMensagemDecisor('')

    if (!formDecisor.empresa_id || !formDecisor.nome) {
      setMensagemDecisor('Selecione a empresa e informe o nome do decisor.')
      setSalvandoDecisor(false)
      return
    }

    const dadosDecisor = {
      empresa_id: formDecisor.empresa_id,
      nome: formDecisor.nome,
      cargo: formDecisor.cargo || null,
      telefone: formDecisor.telefone || null,
      whatsapp: formDecisor.whatsapp || null,
      email: formDecisor.email || null,
      principal: true
    }
    const consultaDecisor = decisorEditandoId
      ? supabase.from('contatos').update(dadosDecisor).eq('id', decisorEditandoId)
      : supabase.from('contatos').insert([dadosDecisor])
    const { error } = await consultaDecisor

    if (error) {
      console.error('Erro ao salvar decisor:', error)
alert('Erro ao salvar decisor: ' + error.message)
  setSalvandoDecisor(false)
      return
    }

    setFormDecisor({
      empresa_id: '',
      nome: '',
      cargo: '',
      telefone: '',
      whatsapp: '',
      email: ''
    })

    setMensagemDecisor(decisorEditandoId ? 'Decisor atualizado com sucesso!' : 'Decisor cadastrado com sucesso!')
    setDecisorEditandoId(null)
    setMostrarFormDecisor(false)
    setSalvandoDecisor(false)
    await carregarDecisores()
  }

  function editarDecisor(contato) {
    setFormDecisor({
      empresa_id: contato.empresa_id || '',
      nome: contato.nome || '',
      cargo: contato.cargo || '',
      telefone: contato.telefone || '',
      whatsapp: contato.whatsapp || '',
      email: contato.email || ''
    })
    setDecisorEditandoId(contato.id)
    setMostrarFormDecisor(true)
  }

  async function excluirDecisor(id) {
  const confirmar = window.confirm('Tem certeza que deseja excluir este decisor?')

  if (!confirmar) return

  const { error } = await supabase
    .from('contatos')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir decisor: ' + error.message)
    return
  }

  await carregarDecisores()
}
  
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Decisores</h1>
            <p>Contatos responsáveis pelas decisões comerciais.</p>
          </div>
          <button
  className="btn-primary"
  onClick={() => { setDecisorEditandoId(null); setFormDecisor({ empresa_id:'', nome:'', cargo:'', telefone:'', whatsapp:'', email:'' }); setMostrarFormDecisor(true) }}
>
  + Novo Decisor
</button>
        </div>

        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Cargo</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>WhatsApp</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contatos.map((contato) => (
                <tr key={contato.id}>
                  <td><b>{contato.nome}</b></td>
                  <td>{nomeEmpresa(contato.empresa_id)}</td>
                  <td>{contato.cargo || '—'}</td>
                  <td>{contato.telefone || '—'}</td>
                  <td>{contato.email || '—'}</td>
                  <td>
                    {contato.whatsapp ? (
                      <a
                        className="whatsapp"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://wa.me/55${String(
                          contato.whatsapp
                        ).replace(/\D/g, '')}`}
                      >
                        Abrir WhatsApp
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                
        <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarDecisor(contato)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirDecisor(contato.id)}>Excluir</button></div></td>
  </tr>           
      ))}
              {!contatos.length && (
                <tr>
                  <td colSpan="7" className="empty">
                    Nenhum decisor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        {mostrarFormDecisor && (
  <section className="panel">
    <h2>{decisorEditandoId ? 'Editar Decisor' : 'Novo Decisor'}</h2>

<form onSubmit={salvarDecisor}>
  <label>Empresa</label>
      <select
        value={formDecisor.empresa_id}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, empresa_id: e.target.value })
        }
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome}
          </option>
        ))}
      </select>

      <label>Nome</label>
      <input
        type="text"
        value={formDecisor.nome}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, nome: e.target.value })
        }
      />

      <label>Cargo</label>
      <input
        type="text"
        value={formDecisor.cargo}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, cargo: e.target.value })
        }
      />

      <label>Telefone</label>
      <input
        type="text"
        value={formDecisor.telefone}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, telefone: e.target.value })
        }
      />

      <label>WhatsApp</label>
      <input
        type="text"
        value={formDecisor.whatsapp}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, whatsapp: e.target.value })
        }
      />

      <label>E-mail</label>
      <input
        type="email"
        value={formDecisor.email}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, email: e.target.value })
        }
      />

     <button type="submit" className="btn-primary" disabled={salvandoDecisor}>
{salvandoDecisor ? 'Salvando...' : 'Salvar Decisor'}
     </button>

      <button
        type="button"
        onClick={() => setMostrarFormDecisor(false)}
      >
        Cancelar
      </button>
    </form>
  </section>
)}
      </>
    )
  }

  async function excluirOportunidade(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta oportunidade?')) return
    const { error } = await supabase.from('oportunidades').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir oportunidade: ' + error.message)
      return
    }
    await carregarDados()
  }

  function Funil() {
    const [agendamentosFunil, setAgendamentosFunil] = useState({})

    async function agendarEEnviarWhatsApp(item) {
      const dataHora = agendamentosFunil[item.id]
      if (!dataHora) {
        alert('Selecione a data e a hora do agendamento.')
        return
      }

      const empresaNome = nomeEmpresa(item.empresa_id)
      const dataFormatada = new Date(dataHora).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })

      const { error } = await supabase.from('tarefas').insert([{
        empresa_id: item.empresa_id || null,
        titulo: 'Agendamento - ' + (item.titulo || empresaNome),
        descricao: 'Agendamento criado pelo Funil Comercial. Etapa: ' + item.etapa,
        data_hora: dataHora,
        prioridade: 'Normal',
        status: 'Pendente'
      }])

      if (error) {
        alert('Erro ao salvar o agendamento: ' + error.message)
        return
      }

      await carregarDados()

      const mensagem = [
        '📅 *AGENDAMENTO CENTRAL TRUCK*',
        '',
        'Empresa: ' + empresaNome,
        'Oportunidade: ' + (item.titulo || '-'),
        'Etapa: ' + item.etapa,
        'Data e hora: ' + dataFormatada
      ].join('\n')

      window.open('https://wa.me/5531975255079?text=' + encodeURIComponent(mensagem), '_blank', 'noopener,noreferrer')
    }

    const etapas = [
      'Lead Novo',
      'Primeiro Contato',
      'Interessado',
      'Visita Agendada',
      'Orçamento Enviado',
      'Em Negociação',
      'Venda Realizada',
      'Venda Perdida',
      'Pós-venda',
    ]


    async function moverOportunidade(id, novaEtapa) {
  const { error } = await supabase
    .from('oportunidades')
    .update({ etapa: novaEtapa })
    .eq('id', id)

  if (error) {
    alert('Erro ao alterar etapa: ' + error.message)
    return
  }

  await carregarDados()
}
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Funil Comercial</h1>
            <p>Acompanhamento das oportunidades por etapa.</p>
          </div>
        </div>

        <div className="kanban">
          {etapas.map((etapa) => {
            const itens = oportunidades.filter((o) => o.etapa === etapa)

            return (
              <div className="kanban-column" key={etapa}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.outline = '2px solid #19df91' }}
                onDragLeave={(e) => { e.currentTarget.style.outline = '' }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.outline = ''
                  const id = e.dataTransfer.getData('text/plain')
                  const item = oportunidades.find(o => String(o.id) === id)
                  if (item && item.etapa !== etapa) moverOportunidade(item.id, etapa)
                }}>
                <div className="kanban-title">
                  <b>{etapa}</b>
                  <span>{itens.length}</span>
                </div>

                {itens.map((item) => (
                 <details className="deal" key={item.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(item.id)); e.dataTransfer.effectAllowed = "move" }} style={{padding:"10px 12px",minHeight:0,cursor:"grab"}}>
  <summary style={{cursor:"pointer",fontWeight:700,listStyle:"revert",overflowWrap:"anywhere"}}>{nomeEmpresa(item.empresa_id) || item.titulo}</summary>
  <div style={{display:"grid",gap:"8px",marginTop:"12px"}}>
  <b>{item.titulo || nomeEmpresa(item.empresa_id)}</b>
  <strong>{dinheiro(item.valor_estimado)}</strong>



  <label className="deal-schedule-label">
    Data e hora do agendamento
    <input
      className="deal-schedule-input"
      type="datetime-local"
      value={agendamentosFunil[item.id] || ''}
      onChange={(e) => setAgendamentosFunil({ ...agendamentosFunil, [item.id]: e.target.value })}
    />
  </label>
  <button type="button" className="btn-whatsapp" onClick={() => agendarEEnviarWhatsApp(item)}>
    Agendar e enviar no WhatsApp
  </button>
  <button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button>
</div>
</details>
                ))}

                {!itens.length && (
                  <div className="kanban-empty">Nenhuma oportunidade</div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  function Oportunidades() {
      const [mostrarFormOportunidade, setMostrarFormOportunidade] = useState(false)
  const [salvandoOportunidade, setSalvandoOportunidade] = useState(false)
  const [mensagemOportunidade, setMensagemOportunidade] = useState('')
  const [selecionadas, setSelecionadas] = useState([])
  const [excluindoLote, setExcluindoLote] = useState(false)
  async function excluirSelecionadas() {
    if (!selecionadas.length || excluindoLote) return
    if (!window.confirm('Excluir definitivamente ' + selecionadas.length + ' oportunidade(s) selecionada(s)? Os cadastros das empresas serão preservados.')) return
    setExcluindoLote(true)
    const {error} = await supabase.from('oportunidades').delete().in('id', selecionadas)
    setExcluindoLote(false)
    if (error) { alert('Não foi possível excluir: ' + error.message); return }
    setSelecionadas([])
    await carregarDados()
  }

  const [formOportunidade, setFormOportunidade] = useState({
    empresa_id: '',
    titulo: '',
    servico: '',
    etapa: 'Lead Novo',
    valor_estimado: '',
    probabilidade: 0,
    previsao_fechamento: '',
    observacoes: ''
  })

  async function salvarOportunidade(e) {
    e.preventDefault()

    if (!formOportunidade.empresa_id || !formOportunidade.titulo) {
      setMensagemOportunidade('Selecione a empresa e informe o título da oportunidade.')
      return
    }

    setSalvandoOportunidade(true)
    setMensagemOportunidade('')

    const { error } = await supabase
      .from('oportunidades')
      .insert([{
        empresa_id: formOportunidade.empresa_id,
        titulo: formOportunidade.titulo,
        servico: formOportunidade.servico || null,
        etapa: formOportunidade.etapa,
        valor_estimado: formOportunidade.valor_estimado
          ? Number(formOportunidade.valor_estimado)
          : null,
        probabilidade: Number(formOportunidade.probabilidade) || 0,
        previsao_fechamento: formOportunidade.previsao_fechamento || null,
        observacoes: formOportunidade.observacoes || null
      }])

    if (error) {
      alert('Erro ao salvar oportunidade: ' + error.message)
      setSalvandoOportunidade(false)
      return
    }

    setFormOportunidade({
      empresa_id: '',
      titulo: '',
      servico: '',
      etapa: 'Lead Novo',
      valor_estimado: '',
      probabilidade: 0,
      previsao_fechamento: '',
      observacoes: ''
    })

    setMensagemOportunidade('Oportunidade cadastrada com sucesso!')
    setMostrarFormOportunidade(false)
    setSalvandoOportunidade(false)

    await carregarDados()
  }
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Oportunidades</h1>
            <p>Negociações comerciais em andamento.</p>
          </div>
        </div>
<button
  type="button"
  className="btn-primary"
  onClick={() => setMostrarFormOportunidade(true)}
>
  + Nova Oportunidade
</button>
<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginTop:12,marginBottom:12}}>
  <button type="button" onClick={()=>setSelecionadas(oportunidades.map(o=>o.id))}>Selecionar todas</button>
  <button type="button" onClick={()=>setSelecionadas([])}>Limpar seleção</button>
  <button type="button" className="btn-excluir" disabled={!selecionadas.length || excluindoLote} onClick={excluirSelecionadas}>
    {excluindoLote ? 'Excluindo...' : 'Excluir selecionadas ('+selecionadas.length+')'}
  </button>
</div>

{mensagemOportunidade && (
  <p>{mensagemOportunidade}</p>
)}
        {mostrarFormOportunidade && (
  <section className="panel">
    <h2>Nova Oportunidade</h2>

    <form onSubmit={salvarOportunidade}>

      <label>Empresa</label>
      <select
        value={formOportunidade.empresa_id}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            empresa_id: e.target.value
          })
        }
        required
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome_fantasia || empresa.nome}
          </option>
        ))}
      </select>

      <label>Título da oportunidade</label>
      <input
        type="text"
        value={formOportunidade.titulo}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            titulo: e.target.value
          })
        }
        placeholder="Ex.: Manutenção sistema ARLA"
        required
      />

      <label>Serviço</label>
      <select
        value={formOportunidade.servico}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            servico: e.target.value
          })
        }
      >
        <option value="">Selecione</option>
        <option value="Catalisador">Catalisador</option>
        <option value="ARLA 32">ARLA 32</option>
        <option value="Diálise">Diálise</option>
        <option value="Diagnóstico">Diagnóstico</option>
        <option value="Sistema SCR">Sistema SCR</option>
        <option value="DPF">DPF</option>
        <option value="Injeção Diesel">Injeção Diesel</option>
        <option value="Elétrica">Elétrica</option>
        <option value="Mecânica Diesel">Mecânica Diesel</option>
      </select>

      <label>Etapa</label>
      <select
        value={formOportunidade.etapa}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            etapa: e.target.value
          })
        }
      >
        <option value="Lead Novo">Lead Novo</option>
        <option value="Primeiro Contato">Primeiro Contato</option>
        <option value="Interessado">Interessado</option>
        <option value="Visita Agendada">Visita Agendada</option>
        <option value="Orçamento Enviado">Orçamento Enviado</option>
        <option value="Em Negociação">Em Negociação</option>
        <option value="Venda Realizada">Venda Realizada</option>
        <option value="Venda Perdida">Venda Perdida</option>
        <option value="Pós-venda">Pós-venda</option>
                  <option value="Já é cliente">Já é cliente</option>
      </select>

      <label>Valor estimado (R$)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={formOportunidade.valor_estimado}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            valor_estimado: e.target.value
          })
        }
      />

      <label>Probabilidade (%)</label>
      <input
        type="number"
        min="0"
        max="100"
        value={formOportunidade.probabilidade}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            probabilidade: e.target.value
          })
        }
      />

      <label>Previsão de fechamento</label>
      <input
        type="date"
        value={formOportunidade.previsao_fechamento}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            previsao_fechamento: e.target.value
          })
        }
      />

      <label>Observações</label>
      <textarea
        value={formOportunidade.observacoes}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            observacoes: e.target.value
          })
        }
      />

      <div>
        <button
          type="submit"
          className="btn-primary"
          disabled={salvandoOportunidade}
        >
          {salvandoOportunidade ? 'Salvando...' : 'Salvar Oportunidade'}
        </button>

        <button
          type="button"
          onClick={() => setMostrarFormOportunidade(false)}
        >
          Cancelar
        </button>
      </div>

    </form>
  </section>
)}
        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Selecionar todas as oportunidades" checked={oportunidades.length>0 && oportunidades.every(o=>selecionadas.includes(o.id))} onChange={e=>setSelecionadas(e.target.checked?oportunidades.map(o=>o.id):[])} /></th>
                <th>Oportunidade</th>
                <th>Empresa</th>
                <th>Serviço</th>
                <th>Etapa</th>
                <th>Valor</th>
                <th>Probabilidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" aria-label={'Selecionar '+(item.titulo||'oportunidade')} checked={selecionadas.includes(item.id)} onChange={e=>setSelecionadas(v=>e.target.checked?[...v,item.id]:v.filter(id=>id!==item.id))}/></td>
                  <td><b>{item.titulo || 'Oportunidade'}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.servico || '—'}</td>
                  <td><span className="status">{item.etapa}</span></td>
                  <td>{dinheiro(item.valor_estimado)}</td>
                  <td>{item.probabilidade || 0}%</td>
                  <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarOportunidade(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button></div></td>
                </tr>
              ))}

              {!oportunidades.length && (
                <tr>
                  <td colSpan="8" className="empty">
                    Nenhuma oportunidade cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </>
    )
  }
function Atendimentos() {
  const [mostrarFormAtendimento, setMostrarFormAtendimento] = useState(false)
const [salvandoAtendimento, setSalvandoAtendimento] = useState(false)
const [mensagemAtendimento, setMensagemAtendimento] = useState('')
const [atendimentoEditandoId, setAtendimentoEditandoId] = useState(null)

const [formAtendimento, setFormAtendimento] = useState({
  empresa_id: '',
  tipo: 'Ligação',
  descricao: '',
  data_atividade: new Date().toISOString().slice(0, 10),
  proximo_retorno: '',
  concluido: false
})

function editarAtendimento(item) {
  setFormAtendimento({
    empresa_id: item.empresa_id || '',
    tipo: item.tipo || 'Ligação',
    descricao: item.descricao || '',
    data_atividade: item.data_atividade ? String(item.data_atividade).slice(0,10) : new Date().toISOString().slice(0,10),
    proximo_retorno: item.proximo_retorno ? String(item.proximo_retorno).slice(0,10) : '',
    concluido: !!item.concluido
  })
  setAtendimentoEditandoId(item.id)
  setMostrarFormAtendimento(true)
}

async function excluirAtendimento(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir este atendimento?'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('atividades')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir atendimento: ' + error.message)
    return
  }

  await carregarDados()
} 
  async function salvarAtendimento(e) {
  e.preventDefault()

  if (!formAtendimento.empresa_id || !formAtendimento.descricao) {
    alert('Selecione a empresa e informe a descrição do atendimento.')
    return
  }

  setSalvandoAtendimento(true)

  const dadosAtendimento = {
    empresa_id: Number(formAtendimento.empresa_id),
    tipo: formAtendimento.tipo,
    descricao: formAtendimento.descricao,
    data_atividade: formAtendimento.data_atividade,
    proximo_retorno: formAtendimento.proximo_retorno || null,
    concluido: formAtendimento.concluido
  }
  const consultaAtendimento = atendimentoEditandoId
    ? supabase.from('atividades').update(dadosAtendimento).eq('id', atendimentoEditandoId)
    : supabase.from('atividades').insert([dadosAtendimento])
  const { error } = await consultaAtendimento

  if (error) {
    alert('Erro ao salvar atendimento: ' + error.message)
    setSalvandoAtendimento(false)
    return
  }

  setMensagemAtendimento(atendimentoEditandoId ? 'Atendimento atualizado com sucesso!' : 'Atendimento registrado com sucesso!')
  setAtendimentoEditandoId(null)
  setMostrarFormAtendimento(false)
  setSalvandoAtendimento(false)

  setFormAtendimento({
    empresa_id: '',
    tipo: 'Ligação',
    descricao: '',
    data_atividade: new Date().toISOString().slice(0, 10),
    proximo_retorno: '',
    concluido: false
  })

  await carregarDados()
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Atendimentos</h1>
          <p>Histórico de contatos e atividades comerciais.</p>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={() => { setAtendimentoEditandoId(null); setFormAtendimento({ empresa_id:'', tipo:'Ligação', descricao:'', data_atividade:new Date().toISOString().slice(0,10), proximo_retorno:'', concluido:false }); setMostrarFormAtendimento(true) }}
      >
        + Novo Atendimento
      </button>

      {mensagemAtendimento && (
        <p>{mensagemAtendimento}</p>
      )}

      {mostrarFormAtendimento && (
        <section className="panel">
          <form onSubmit={salvarAtendimento}>

            <label>Empresa</label>
            <select
              value={formAtendimento.empresa_id}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  empresa_id: e.target.value
                })
              }
              required
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>

            <label>Tipo de atendimento</label>
            <select
              value={formAtendimento.tipo}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  tipo: e.target.value
                })
              }
            >
              <option value="Ligação">Ligação</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Visita">Visita</option>
              <option value="E-mail">E-mail</option>
              <option value="Reunião">Reunião</option>
              <option value="Orçamento">Orçamento</option>
              <option value="Observação">Observação</option>
            </select>

            <label>Descrição</label>
            <textarea
              value={formAtendimento.descricao}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  descricao: e.target.value
                })
              }
              placeholder="Descreva o atendimento realizado..."
              required
            />

            <label>Data do atendimento</label>
            <input
              type="date"
              value={formAtendimento.data_atividade}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  data_atividade: e.target.value
                })
              }
            />

            <label>Próximo retorno</label>
            <input
              type="date"
              value={formAtendimento.proximo_retorno}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  proximo_retorno: e.target.value
                })
              }
            />

            <label>
              <input
                type="checkbox"
                checked={formAtendimento.concluido}
                onChange={(e) =>
                  setFormAtendimento({
                    ...formAtendimento,
                    concluido: e.target.checked
                  })
                }
              />
              Atendimento concluído
            </label>

            <div>
              <button
                type="submit"
                className="btn-primary"
                disabled={salvandoAtendimento}
              >
                {salvandoAtendimento ? 'Salvando...' : 'Salvar Atendimento'}
              </button>

              <button
                type="button"
                onClick={() => setMostrarFormAtendimento(false)}
              >
                Cancelar
              </button>
            </div>

          </form>
        </section>
      )}

      <section className="panel">
        {atividades.map((item) => (
          <div className="activity" key={item.id}>
            <div className="activity-icon"></div>

            <div>
              <b>{item.tipo || 'Atendimento'}</b>
              <span>{nomeEmpresa(item.empresa_id)}</span>
              <p>{item.descricao || 'Sem descrição.'}</p>

              {item.proximo_retorno && (
                <p>
                  Próximo retorno: {dataBR(item.proximo_retorno)}
                </p>
              )}
            </div>

            <small>{dataBR(item.data_atividade)}</small>
            <div className="actions">{linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade) && <a className="btn-whatsapp" href={linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade)} target="_blank" rel="noreferrer">WhatsApp</a>}<button type="button" className="btn-editar" onClick={() => editarAtendimento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirAtendimento(item.id)}>Excluir</button></div>
          </div>
        ))}

        {!atividades.length && (
          <div className="empty">
            Nenhum atendimento registrado. Os botões Editar e Excluir aparecerão em cada atendimento cadastrado.
          </div>
        )}
      </section>
    </>
  )
}
  function Agenda() {
    const [mostrarFormTarefa, setMostrarFormTarefa] = useState(() => !!sessionStorage.getItem('centraltruck_agendar_empresa') || !!localStorage.getItem('ct_rascunho_agenda'))
    const [salvandoTarefa, setSalvandoTarefa] = useState(false)
    const [mensagemTarefa, setMensagemTarefa] = useState('')
    const [lembrarNoCRM, setLembrarNoCRM] = useState(true)
    const [antecedencia, setAntecedencia] = useState('0')
    const [avisosAgenda, setAvisosAgenda] = useState([])
    const numeroLembrete = '31975255079'
    useEffect(() => {
      const verificar = () => {
        const agora = Date.now()
        const avisos = tarefas.filter(t => {
          if (t.status === 'Concluída' || !t.data_hora || localStorage.getItem('ct_lembrete_' + t.id) === 'nao') return false
          const prazo = new Date(t.data_hora).getTime() - Number(localStorage.getItem('ct_antecedencia_' + t.id) || 0) * 60000
          return prazo <= agora && agora - prazo < 86400000
        })
        setAvisosAgenda(avisos)
        avisos.forEach(t => {
          const chave = 'ct_aviso_exibido_' + t.id + '_' + t.data_hora
          if (!sessionStorage.getItem(chave) && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Central Truck — Lembrete', {body: t.titulo + ' • ' + (nomeEmpresa(t.empresa_id) || 'Contato')})
            sessionStorage.setItem(chave, 'sim')
          }
        })
      }
      verificar()
      const intervalo = setInterval(verificar, 60000)
      return () => clearInterval(intervalo)
    }, [tarefas])
    const whatsappParaMim = tarefa => {
      const telefone = numeroLembrete.replace(/\D/g, '')
      const destino = telefone.startsWith('55') ? telefone : '55' + telefone
      const mensagem = 'LEMBRETE CENTRAL TRUCK%0A' + encodeURIComponent('Cliente: ' + nomeEmpresa(tarefa.empresa_id) + '\nTarefa: ' + tarefa.titulo + '\nData: ' + dataBR(tarefa.data_hora) + '\n' + (tarefa.descricao || ''))
      return 'https://wa.me/' + destino + '?text=' + mensagem
    }

    const [tarefaEditandoId, setTarefaEditandoId] = useState(null)
    const [formTarefa, setFormTarefa] = useState(() => {
       try { const salvo = JSON.parse(localStorage.getItem('ct_rascunho_agenda') || 'null'); if (salvo && typeof salvo === 'object') return salvo } catch (_) {}
       return { empresa_id: '', cliente_avulso: '', titulo: '', descricao: '', data_hora: '', prioridade: 'Normal', status: 'Pendente' }
     })
     useEffect(() => {
       if (mostrarFormTarefa) localStorage.setItem('ct_rascunho_agenda', JSON.stringify(formTarefa))
     }, [formTarefa, mostrarFormTarefa])

    useEffect(() => {
      const id = sessionStorage.getItem('centraltruck_agendar_empresa')
      if (id) {
        setFormTarefa(anterior => ({ ...anterior, empresa_id: id, titulo: 'Retornar contato', status: 'Pendente' }))
        setMostrarFormTarefa(true)
        sessionStorage.removeItem('centraltruck_agendar_empresa')
      }
    }, [])

    function editarTarefa(item) {
      setFormTarefa({
        empresa_id: item.empresa_id || '',
        cliente_avulso: (item.descricao || '').match(/^Cliente não cadastrado: (.*?)(?:\n|$)/)?.[1] || '',
        titulo: item.titulo || '',
        descricao: (item.descricao || '').replace(/^Cliente não cadastrado: .*?(?:\n|$)/, ''),
        data_hora: item.data_hora ? String(item.data_hora).slice(0,16) : '',
        prioridade: item.prioridade || 'Normal',
        status: item.status || 'Pendente'
      })
      setTarefaEditandoId(item.id)
      setLembrarNoCRM(localStorage.getItem('ct_lembrete_' + item.id) !== 'nao')
      setAntecedencia(localStorage.getItem('ct_antecedencia_' + item.id) || '0')
      setMostrarFormTarefa(true)
    }

    async function excluirTarefa(id) {
      const confirmar = window.confirm('Tem certeza que deseja excluir esta tarefa?')
      if (!confirmar) return

      const { error } = await supabase.from('tarefas').delete().eq('id', id)
      if (error) {
        alert('Erro ao excluir tarefa: ' + error.message)
        return
      }
      await carregarDados()
    }

    async function salvarTarefa(e) {
      e.preventDefault()

      if (!formTarefa.titulo.trim() || !formTarefa.data_hora) {
        alert('Informe o título e a data/hora da tarefa.')
        return
      }

      setSalvandoTarefa(true)
      setMensagemTarefa('')

      const dadosTarefa = {
        empresa_id: formTarefa.empresa_id ? Number(formTarefa.empresa_id) : null,
        titulo: formTarefa.titulo.trim(),
        descricao: [!formTarefa.empresa_id && formTarefa.cliente_avulso.trim() ? 'Cliente não cadastrado: ' + formTarefa.cliente_avulso.trim() : '', formTarefa.descricao.trim()].filter(Boolean).join('\n') || null,
        data_hora: formTarefa.data_hora,
        prioridade: formTarefa.prioridade,
        status: formTarefa.status,
      }
      const consultaTarefa = tarefaEditandoId
        ? supabase.from('tarefas').update(dadosTarefa).eq('id', tarefaEditandoId)
        : supabase.from('tarefas').insert([dadosTarefa])
      const { error } = await consultaTarefa

      if (error) {
        alert('Erro ao salvar tarefa: ' + error.message)
        setSalvandoTarefa(false)
        return
      }

      const idSalvo = tarefaEditandoId
      if (idSalvo) { localStorage.setItem('ct_lembrete_' + idSalvo, lembrarNoCRM ? 'sim' : 'nao'); localStorage.setItem('ct_antecedencia_' + idSalvo, antecedencia) }
      localStorage.removeItem('ct_rascunho_agenda')
       setMensagemTarefa(tarefaEditandoId ? 'Tarefa atualizada com sucesso!' : 'Tarefa cadastrada com sucesso!')
      setTarefaEditandoId(null)
      setMostrarFormTarefa(false)
      setSalvandoTarefa(false)
      setFormTarefa({
        empresa_id: '',
        titulo: '',
        descricao: '',
        data_hora: '',
        prioridade: 'Normal',
        status: 'Pendente',
      })
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Agenda</h1>
            <p>Retornos, ligações, visitas e tarefas comerciais. {tarefas.length} tarefa(s) sincronizada(s) com o Dashboard.</p>
          </div>
        </div>

        <button type="button" className="btn-secondary" onClick={carregarDados} style={{marginRight:12}}>↻ Atualizar agendamentos</button>
        {erro && <p role="alert">Erro ao carregar agenda: {erro}</p>}
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setTarefaEditandoId(null); setFormTarefa({ empresa_id:'', cliente_avulso:'', titulo:'', descricao:'', data_hora:'', prioridade:'Normal', status:'Pendente' }); setMostrarFormTarefa(true) }}
        >
          + Nova Tarefa
        </button>

        {mostrarFormTarefa && (
          <section className="panel form-panel">
            <form onSubmit={salvarTarefa}>
              <div className="form-grid">
                <label>
                  Empresa
                  <select
                    value={formTarefa.empresa_id}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, empresa_id: e.target.value })
                    }
                  >
                    <option value="">Sem empresa vinculada</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome_fantasia || empresa.nome}
                      </option>
                    ))}
                  </select>
                </label>

                {!formTarefa.empresa_id && (
                  <label>
                    Nome do cliente não cadastrado
                    <input
                      type="text"
                      value={formTarefa.cliente_avulso || ''}
                      onChange={(e) => setFormTarefa({ ...formTarefa, cliente_avulso: e.target.value })}
                      placeholder="Digite o nome do cliente ou empresa"
                    />
                  </label>
                )}

                <label>
                  Título
                  <input
                    type="text"
                    value={formTarefa.titulo}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, titulo: e.target.value })
                    }
                    placeholder="Ex.: Retornar para cliente"
                    required
                  />
                </label>

                <label>
                  Data e hora
                  <input
                    type="datetime-local"
                    value={formTarefa.data_hora}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, data_hora: e.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Prioridade
                  <select
                    value={formTarefa.prioridade}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, prioridade: e.target.value })
                    }
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={formTarefa.status}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, status: e.target.value })
                    }
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </label>

                <label className="full">
                  Descrição
                  <textarea
                    value={formTarefa.descricao}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, descricao: e.target.value })
                    }
                    placeholder="Observações sobre a tarefa..."
                  />
                </label>
              </div>

              <div style={{margin:'12px 0',display:'flex',gap:'14px',flexWrap:'wrap',alignItems:'center'}}><label><input type="checkbox" checked={lembrarNoCRM} onChange={e=>setLembrarNoCRM(e.target.checked)} /> Lembrar no CRM</label><label>Antecedência <select value={antecedencia} onChange={e=>setAntecedencia(e.target.value)}><option value="0">Na hora</option><option value="15">15 minutos</option><option value="60">1 hora</option><option value="1440">1 dia</option></select></label><button type="button" onClick={() => { if ('Notification' in window) Notification.requestPermission(); else alert('Seu navegador não suporta notificações.'); }}>Ativar notificações do navegador</button></div><p style={{fontSize:'12px'}}>Avisos automáticos funcionam enquanto o CRM estiver aberto. O envio pelo WhatsApp exige clicar em enviar.</p>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={salvandoTarefa}>
                  {salvandoTarefa ? 'Salvando...' : 'Salvar Tarefa'}
                </button>
                <button type="button" onClick={() => setMostrarFormTarefa(false)}>
                  Cancelar
                </button>
              </div>

              {mensagemTarefa && <p>{mensagemTarefa}</p>}
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-heading"><div><h2>Agendamentos cadastrados ({tarefas.length})</h2><p>Todos os contatos salvos na Agenda.</p></div></div>
          {tarefas.map((tarefa) => (
            <div className="activity" key={tarefa.id}>
              <div className="activity-icon">✓</div>
              <div>
                <b>{tarefa.titulo}</b>
                <span>{nomeEmpresa(tarefa.empresa_id)}</span>
                <p>{tarefa.descricao || 'Sem descrição.'}</p>
              </div>
              <div className="task-date">
                <b>{dataBR(tarefa.data_hora)}</b>
                <span>{tarefa.status}</span>
                <div className="actions">
                  <a className="btn-whatsapp" href={whatsappParaMim(tarefa)} target="_blank" rel="noreferrer">🔔 Lembrete no meu WhatsApp</a>
                  <button type="button" className="btn-editar" onClick={() => editarTarefa(tarefa)}>Editar</button>
                  <button type="button" className="btn-excluir" onClick={() => excluirTarefa(tarefa.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
          {!tarefas.length && (
            <div className="empty">Nenhuma tarefa cadastrada.</div>
          )}
        </section>
      </>
    )
  }

  function Orcamentos() {
    const chaveRascunho = 'centraltruck_orcamento_rascunho_' + (session?.user?.id || 'local')
    const [mostrarForm, setMostrarForm] = useState(() => {
      try { return Boolean(JSON.parse(localStorage.getItem(chaveRascunho))?.aberto) } catch { return false }
    })
    const [salvando, setSalvando] = useState(false)
    const [filtroMes, setFiltroMes] = useState('')
    const [filtroInicio, setFiltroInicio] = useState('')
    const [filtroFim, setFiltroFim] = useState('')
    const orcamentosFiltrados = orcamentos.filter(item => {
      if (!item.data_envio) return !filtroMes && !filtroInicio && !filtroFim
      const data = String(item.data_envio).slice(0,10)
      if (filtroMes && data.slice(0,7) !== filtroMes) return false
      if (filtroInicio && data < filtroInicio) return false
      if (filtroFim && data > filtroFim) return false
      return true
    })
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(() => {
      try { return JSON.parse(localStorage.getItem(chaveRascunho))?.editandoId ?? null } catch { return null }
    })
    const [osAberta, setOsAberta] = useState(null)
    const [osArquivos, setOsArquivos] = useState([])
    const [osErro, setOsErro] = useState('')
    const [osEnviando, setOsEnviando] = useState(false)
    async function carregarOS(item) {
      setOsAberta(item)
      setOsErro('')
      const {data,error} = await supabase.storage.from('orcamento-anexos').list(String(item.id))
      if(error){setOsErro('Armazenamento indisponível: '+error.message);setOsArquivos([]);return}
      setOsArquivos((data||[]).filter(x=>x.name!=='.emptyFolderPlaceholder'))
    }
    async function anexarOS(e) {
      const arquivo=e.target.files?.[0]
      e.target.value=''
      if(!arquivo||!osAberta)return
      if(arquivo.size>10485760){setOsErro('Limite de 10 MB por arquivo.');return}
      if(!/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(arquivo.name)){setOsErro('Selecione PDF, Word ou imagem.');return}
      setOsEnviando(true)
      setOsErro('')
      try {
        const nome=Date.now()+'-'+arquivo.name.replace(/[^a-zA-Z0-9._-]/g,'_')
        const {error}=await supabase.storage.from('orcamento-anexos').upload(String(osAberta.id)+'/'+nome,arquivo)
        if(error)throw error
        await carregarOS(osAberta)
      }catch(error){setOsErro('Erro ao salvar OS: '+error.message)}
      finally{setOsEnviando(false)}
    }
    async function visualizarOS(nome) {
      const {data,error}=await supabase.storage.from('orcamento-anexos').createSignedUrl(String(osAberta.id)+'/'+nome,120)
      if(error){setOsErro(error.message);return}
      window.open(data.signedUrl,'_blank','noopener,noreferrer')
    }
    const [form, setForm] = useState(() => {
      let anterior = null
      try { anterior = JSON.parse(localStorage.getItem(chaveRascunho))?.form } catch {}
      return anterior || {
      empresa_id: '',
      oportunidade_id: '',
      numero_orcamento: '',
      descricao: '',
      valor: '',
      status: 'Enviado',
      data_envio: new Date().toISOString().slice(0, 10),
      validade: '',
      observacoes: '',
      }
    })
    useEffect(() => {
      if (mostrarForm) localStorage.setItem(chaveRascunho, JSON.stringify({aberto:true,editandoId:orcamentoEditandoId,form}))
    }, [mostrarForm, orcamentoEditandoId, form, chaveRascunho])

    async function salvarOrcamento(e) {
      e.preventDefault()
      if (!form.empresa_id || !form.descricao) {
        alert('Selecione a empresa e informe a descrição.')
        return
      }
      setSalvando(true)
      const dadosOrcamento = {
        empresa_id: Number(form.empresa_id),
        oportunidade_id: form.oportunidade_id ? Number(form.oportunidade_id) : null,
        numero_orcamento: form.numero_orcamento.trim() || null,
        descricao: form.descricao.trim(),
        valor: form.valor ? Number(form.valor) : null,
        status: form.status,
        data_envio: form.data_envio || null,
        validade: form.validade || null,
        observacoes: form.observacoes.trim() || null,
      }
      const consultaOrcamento = orcamentoEditandoId
        ? supabase.from('orcamentos').update(dadosOrcamento).eq('id', orcamentoEditandoId)
        : supabase.from('orcamentos').insert([dadosOrcamento])
      const { error } = await consultaOrcamento
      if (error) {
        alert('Erro ao salvar orçamento: ' + error.message)
        setSalvando(false)
        return
      }
      setForm({
        empresa_id: '', oportunidade_id: '', numero_orcamento: '', descricao: '',
        valor: '', status: 'Enviado', data_envio: new Date().toISOString().slice(0, 10),
        validade: '', observacoes: '',
      })
      localStorage.removeItem(chaveRascunho)
      setOrcamentoEditandoId(null)
      setMostrarForm(false)
      setSalvando(false)
      await carregarDados()
    }

    function editarOrcamento(item) {
      setForm({
        empresa_id: item.empresa_id || '',
        oportunidade_id: item.oportunidade_id || '',
        numero_orcamento: item.numero_orcamento || '',
        descricao: item.descricao || '',
        valor: item.valor ?? '',
        status: item.status || 'Enviado',
        data_envio: item.data_envio ? String(item.data_envio).slice(0,10) : '',
        validade: item.validade ? String(item.validade).slice(0,10) : '',
        observacoes: item.observacoes || ''
      })
      setOrcamentoEditandoId(item.id)
      setMostrarForm(true)
    }

    async function excluirOrcamento(id) {
      if (!window.confirm('Excluir este orçamento?')) return
      const { error } = await supabase.from('orcamentos').delete().eq('id', id)
      if (error) return alert('Erro ao excluir orçamento: ' + error.message)
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Orçamentos</h1>
            <p>Controle dos orçamentos enviados aos clientes.</p>
          </div>
          <button className="primary" onClick={() => {
            if (mostrarForm) { localStorage.removeItem(chaveRascunho); setMostrarForm(false); setOrcamentoEditandoId(null); return }
            setOrcamentoEditandoId(null)
            setForm({ empresa_id:'', oportunidade_id:'', numero_orcamento:'', descricao:'', valor:'', status:'Enviado', data_envio:new Date().toISOString().slice(0,10), validade:'', observacoes:'' })
            setMostrarForm(true)
          }}>
            {mostrarForm ? 'Cancelar' : '+ Novo Orçamento'}
          </button>
        </div>

        {mostrarForm && (
          <section className="panel">
            <h2>{orcamentoEditandoId ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
            <form onSubmit={salvarOrcamento}>
              <div className="form-grid">
                <label>Empresa *
                  <select value={form.empresa_id} onChange={(e) => setForm({...form, empresa_id:e.target.value})} required>
                    <option value="">Selecione</option>
                    {empresas.map((x)=><option key={x.id} value={x.id}>{x.nome_fantasia || x.nome}</option>)}
                  </select>
                </label>
                <label>Oportunidade
                  <select value={form.oportunidade_id} onChange={(e) => setForm({...form, oportunidade_id:e.target.value})}>
                    <option value="">Sem vínculo</option>
                    {oportunidades.filter((x)=>!form.empresa_id || String(x.empresa_id)===String(form.empresa_id)).map((x)=><option key={x.id} value={x.id}>{x.titulo}</option>)}
                  </select>
                </label>
                <label>Número
                  <input value={form.numero_orcamento} onChange={(e)=>setForm({...form,numero_orcamento:e.target.value})} placeholder="Ex.: ORC-001"/>
                </label>
                <label>Valor (R$)
                  <input type="number" min="0" step="0.01" value={form.valor} onChange={(e)=>setForm({...form,valor:e.target.value})}/>
                </label>
                <label>Status
                  <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                    {['Rascunho','Enviado','Visualizado','Em negociação','Aprovado','Recusado','Finalizado'].map((x)=><option key={x}>{x}</option>)}
                  </select>
                </label>
                <label>Data de envio
                  <input type="date" value={form.data_envio} onChange={(e)=>setForm({...form,data_envio:e.target.value})}/>
                </label>
                <label>Validade
                  <input type="date" value={form.validade} onChange={(e)=>setForm({...form,validade:e.target.value})}/>
                </label>
                <label className="full">Descrição *
                  <textarea value={form.descricao} onChange={(e)=>setForm({...form,descricao:e.target.value})} required/>
                </label>
                <label className="full">Observações
                  <textarea value={form.observacoes} onChange={(e)=>setForm({...form,observacoes:e.target.value})}/>
                </label>
              </div>
              <div className="form-actions">
                <button className="primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar Orçamento'}</button>
              </div>
            </form>
          </section>
        )}

        {osAberta && <section className="panel">
          <h2>Anexar OS — Orçamento {osAberta.numero_orcamento || osAberta.id}</h2>
          <p>Selecione PDF, Word ou imagem (máximo 10 MB).</p>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={osEnviando} onChange={anexarOS}/>
          {osEnviando && <p>Enviando...</p>}
          {osErro && <p role="alert" style={{color:'#ff8585'}}>{osErro}</p>}
          {osArquivos.map(a=><div key={a.name} style={{marginTop:10}}>
            <span>{a.name} </span>
            <button type="button" onClick={()=>visualizarOS(a.name)}>Abrir / baixar</button>
          </div>)}
          <button type="button" onClick={()=>setOsAberta(null)}>Fechar</button>
        </section>}
        <section className="panel" style={{marginBottom:16}}>
          <h2>Filtrar orçamentos por mês e data</h2>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}>
            <label>Mês <input type="month" value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/></label>
            <label>Data inicial <input type="date" value={filtroInicio} onChange={e=>setFiltroInicio(e.target.value)}/></label>
            <label>Data final <input type="date" value={filtroFim} onChange={e=>setFiltroFim(e.target.value)}/></label>
            <button type="button" onClick={()=>{setFiltroMes('');setFiltroInicio('');setFiltroFim('')}}>Limpar filtros</button>
          </div>
          <p>{orcamentosFiltrados.length} orçamento(s) encontrado(s)</p>
        </section>
        <section className="panel table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Empresa</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Envio</th><th>Ações</th></tr></thead>
            <tbody>
              {orcamentosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.numero_orcamento || `#${item.id}`}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.descricao || '—'}</td>
                  <td>{dinheiro(item.valor)}</td>
                  <td><span className="status">{item.status}</span></td>
                  <td>{dataBR(item.data_envio)}</td>
                  <td><div className="actions"><button type="button" onClick={() => carregarOS(item)}>Anexar OS</button><button type="button" className="btn-editar" onClick={() => editarOrcamento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={()=>excluirOrcamento(item.id)}>Excluir</button></div></td>
                </tr>
              ))}
              {!orcamentos.length && <tr><td colSpan="7" className="empty">Nenhum orçamento cadastrado.</td></tr>}
            </tbody>
          </table>
        </section>
      </>
    )
  }

  function Relatorios() {
    const [arquivoLeads, setArquivoLeads] = useState(null)
    const [importandoLeads, setImportandoLeads] = useState(false)
    const [msgImportacao, setMsgImportacao] = useState('')

    async function baixarModeloLeads() {
      const XLSX = await import('xlsx')
      const dados = [
        ['CENTRAL TRUCK SERVICE'],
        ['LISTA DE LEADS - IMPORTACAO PARA O CRM'],
        [],
        ['Nome da empresa','Nome fantasia','CNPJ','Segmento','Classificacao','Status','Cidade','Estado','Telefone','WhatsApp','E-mail','Site','Observacoes'],
        ['Transportadora Exemplo','Exemplo Logistica','','Transportadora','A','Lead novo','Contagem','MG','31999999999','31999999999','contato@exemplo.com.br','','Cliente para prospeccao']
      ]
      const ws = XLSX.utils.aoa_to_sheet(dados)
      ws['!merges'] = [XLSX.utils.decode_range('A1:M1'), XLSX.utils.decode_range('A2:M2')]
      ws['!cols'] = [{wch:28},{wch:26},{wch:20},{wch:20},{wch:15},{wch:20},{wch:20},{wch:10},{wch:18},{wch:18},{wch:30},{wch:28},{wch:38}]
      ws['!rows'] = [{hpt:34},{hpt:25},{hpt:8},{hpt:28}]
      ws['!autofilter'] = { ref: 'A4:M5' }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Leads Central Truck')
      XLSX.writeFile(wb, 'Modelo_Leads_Central_Truck.xlsx')
    }

    function separarCSV(linha) {
      const valores = []
      let atual = ''
      let aspas = false
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i]
        if (ch === '"') {
          if (aspas && linha[i + 1] === '"') { atual += '"'; i++ } else aspas = !aspas
        } else if ((ch === ',' || ch === ';') && !aspas) {
          valores.push(atual.trim()); atual = ''
        } else atual += ch
      }
      valores.push(atual.trim())
      return valores
    }

    async function importarLeads() {
      if (!arquivoLeads) { setMsgImportacao('Selecione um arquivo para continuar.'); return }
      const extensao = (arquivoLeads.name.split('.').pop() || '').toLowerCase()
      if (extensao !== 'csv') {
        setMsgImportacao('Arquivo recebido sem alterar o original. PDF, JPG/PNG e Word podem ser enviados e mantidos no formato original; para cadastrar clientes automaticamente no Funil, use CSV.')
        return
      }
      setImportandoLeads(true)
      setMsgImportacao('')
      try {
        const texto = await arquivoLeads.text()
        const linhas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim())
        if (linhas.length < 2) throw new Error('O arquivo está vazio ou sem clientes.')
        const colunas = separarCSV(linhas[0]).map((x) => x.toLowerCase().trim())
        const obrigatoria = colunas.indexOf('nome')
        if (obrigatoria < 0) throw new Error('A coluna "nome" é obrigatória. Use o modelo disponível.')
        let importados = 0
        let falhas = 0
        for (const linha of linhas.slice(1)) {
          const valores = separarCSV(linha)
          const registro = {}
          colunas.forEach((col, idx) => { registro[col] = (valores[idx] || '').trim() })
          if (!registro.nome) { falhas++; continue }
          const status = registro.status || 'Lead novo'
          const empresa = {
            nome: registro.nome,
            nome_fantasia: registro.nome_fantasia || null,
            cnpj: registro.cnpj || null,
            segmento: registro.segmento || null,
            classificacao: ['A','B','C'].includes((registro.classificacao || '').toUpperCase()) ? registro.classificacao.toUpperCase() : 'B',
            status,
            cidade: registro.cidade || null,
            estado: registro.estado || 'MG',
            telefone: registro.telefone || null,
            whatsapp: registro.whatsapp || null,
            email: registro.email || null,
            site: registro.site || null,
            observacoes: registro.observacoes || null
          }
          const { data: criada, error: erroEmpresa } = await supabase.from('empresas').insert([empresa]).select('id').single()
          if (erroEmpresa || !criada?.id) { falhas++; continue }
          importados++
        }
        await carregarDados()
        setArquivoLeads(null)
        setMsgImportacao(importados + ' cliente(s) importado(s) para Empresas/Leads. Oportunidades só serão criadas quando cadastradas explicitamente.' + (falhas ? ' ' + falhas + ' linha(s) com erro.' : ''))
      } catch (e) {
        setMsgImportacao('Erro na importação: ' + e.message)
      } finally {
        setImportandoLeads(false)
      }
    }

    return (
      <>
        <div className="page-title"><div><h1>Relatórios</h1><p>Indicadores comerciais da Central Truck.</p></div></div>
        <section className="cards">
          <Card titulo="Leads" valor={empresas.length} />
          <Card titulo="Contatos" valor={contatos.length} />
          <Card titulo="Oportunidades" valor={oportunidades.length} />
          <Card titulo="Vendas" valor={vendas.length} />
          <Card titulo="Conversão" valor={`${conversao}%`} />
          <Card titulo="Valor Vendido" valor={dinheiro(valorVendido)} />
        </section>
        <section className="panel lead-import-panel">
          <div className="panel-heading">
            <div><h2>Enviar relatórios e importar clientes</h2><p>Selecione PDF, JPG, PNG, Word ou CSV. O arquivo original é mantido sem alteração; listas em CSV podem ser organizadas automaticamente em Empresas/Leads e no Funil Comercial.</p></div>
          </div>
          <div className="lead-import-actions">
            <button type="button" className="btn-secondary" onClick={baixarModeloLeads}>Baixar modelo Excel</button>
            <label className="file-import-box">
              <span>{arquivoLeads ? arquivoLeads.name : 'Selecionar lista de clientes (.CSV)'}</span>
              <input type="file" accept=".csv,text/csv" onChange={(e)=>{setArquivoLeads(e.target.files?.[0] || null);setMsgImportacao('')}} />
            </label>
            <button type="button" className="primary" disabled={importandoLeads || !arquivoLeads} onClick={importarLeads}>{importandoLeads ? 'Importando...' : 'Importar clientes para o Funil'}</button>
          </div>
          <p className="import-help"><b>Importação de clientes:</b> use CSV para cadastrar automaticamente Empresas/Leads e criar as oportunidades no Funil. Colunas aceitas: nome, nome_fantasia, CNPJ, segmento, classificação A/B/C, status, cidade, estado, telefone, WhatsApp, e-mail, site e observações.</p>
          <div className="import-message"><b>Relatórios PDF, JPG, PNG e Word:</b> são documentos para consulta e não são convertidos automaticamente em clientes, evitando perda de formatação ou cadastro incorreto. Para importar uma lista desses formatos, converta-a primeiro para CSV usando o modelo acima.</div>
          {msgImportacao && <div className="import-message">{msgImportacao}</div>}
        </section>
      </>
    )
  }


  function ImportarContatos() {
    const [arquivo, setArquivo] = useState(null)
    const [importando, setImportando] = useState(false)
    const [mensagem, setMensagem] = useState('')

    const normalizar = (v='') => String(v ?? '').trim()
    const chave = (v='') => normalizar(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')

    function valorCampo(registro, nomes) {
      for (const nome of nomes) {
        const k = Object.keys(registro).find(x => chave(x) === chave(nome))
        if (k && normalizar(registro[k])) return normalizar(registro[k])
      }
      return ''
    }

    async function lerArquivo(file) {
      const ext=(file.name.split('.').pop()||'').toLowerCase()
      if (['xlsx','xls','xlsm','xlsb','ods','csv','txt'].includes(ext)) {
        const XLSX=await import('xlsx')
        const buffer=await file.arrayBuffer()
        const wb=XLSX.read(buffer,{type:'array'})
        const aliases=['empresa','nome da empresa','razao social','nome fantasia','nome','cliente','oficina','estabelecimento','organizacao','company','organization','contato','nome do contato','telefone','celular','whatsapp','email','e-mail','endereco','cidade','cnpj','responsavel']
        const saida=[]
        for(const nomeAba of wb.SheetNames){
          const matriz=XLSX.utils.sheet_to_json(wb.Sheets[nomeAba],{header:1,defval:'',raw:false,blankrows:false})
          if(!matriz.length) continue
          const pontuacao=linha=>(Array.isArray(linha)?linha:[]).filter(c=>aliases.some(a=>chave(c)===chave(a)||chave(c).startsWith(chave(a))&&chave(a).length>4)).length
          const candidatos=matriz.slice(0,30).map((linha,i)=>({i,p:pontuacao(linha)})).sort((a,b)=>b.p-a.p)
          const indice=candidatos[0]?.p>=2?candidatos[0].i:-1
          if(indice<0) continue
          const titulos=matriz[indice].map((c,i)=>normalizar(c)||'Coluna '+(i+1))
          const registros=matriz.slice(indice+1).filter(linha=>Array.isArray(linha)&&linha.some(c=>normalizar(c))).map(linha=>Object.fromEntries(titulos.map((titulo,i)=>[titulo,linha[i]??''])))
          saida.push(...registros)
        }
        if(!saida.length) throw new Error('Não identifiquei automaticamente os campos desta planilha. Envie uma planilha com títulos como Nome, Empresa, Telefone ou E-mail.')
        return saida
      }
      if (['json'].includes(ext)) {
        const obj=JSON.parse(await file.text())
        return Array.isArray(obj)?obj:(obj.contatos||obj.clientes||obj.empresas||[])
      }
      if (['vcf','vcard'].includes(ext)) {
        const texto=await file.text()
        return texto.split(/BEGIN:VCARD/i).slice(1).map(bloco=>{
          const pega=(re)=>((bloco.match(re)||[])[1]||'').trim()
          return {nome:pega(/\nFN[^:]*:([^\r\n]+)/i),telefone:pega(/\nTEL[^:]*:([^\r\n]+)/i),email:pega(/\nEMAIL[^:]*:([^\r\n]+)/i),empresa:pega(/\nORG[^:]*:([^\r\n]+)/i)}
        })
      }
      throw new Error('Formato não compatível para importação automática.')
    }

    async function importar() {
      if(!arquivo){setMensagem('Selecione um arquivo.');return}
      setImportando(true); setMensagem('')
      try{
        const linhas=await lerArquivo(arquivo)
        if(!linhas.length) throw new Error('Nenhum contato encontrado no arquivo.')
        let ok=0, erros=0
        for(const r of linhas){
          const nomeEmpresa=valorCampo(r,['nome da empresa','empresa','razao social','razão social','nome fantasia','cliente','oficina','estabelecimento','organização','nome','company','organization','org','nome do contato','contato'])
          const contato=valorCampo(r,['pessoa de contato','contato','responsavel','responsável','nome do contato','nome decisor / contato','contact','contact name'])
          const camposTelefone = Object.keys(r).filter(k => /^(telefone|fone|tel|celular|whatsapp|whats|zap|phone|mobile|contatotelefonico|numero)/.test(chave(k)))
          const telefone=valorCampo(r,['telefone','telefone comercial','fone','phone','celular','mobile','telefone 1','telefone principal','telefone 2','telefone de contato','contato telefonico','fone/whatsapp','telefone/whatsapp','tel','numero de telefone']) || camposTelefone.map(k => normalizar(r[k])).find(Boolean) || ''
          const whatsapp=valorCampo(r,['whatsapp','telefone direto / whatsapp','telefone direto whatsapp','whats app','zap','celular whatsapp','telefone whatsapp']) || telefone
          const email=valorCampo(r,['email','e-mail','e-mail corporativo / público','email corporativo publico','mail','correio eletronico'])
          const cidade=valorCampo(r,['cidade','city'])
          const estado=valorCampo(r,['estado','uf','state']) || 'MG'
          const segmento=valorCampo(r,['segmento','categoria','ramo'])
          const status=valorCampo(r,['status','etapa']) || 'Lead novo'
          const cnpj=valorCampo(r,['cnpj','cpf/cnpj','documento'])
          const observacoes=[valorCampo(r,['observacoes','observações','obs','notes']),...['Cargo / área decisora','Frota / operação','Tecnologias / equipamentos','Prioridade','LinkedIn decisor','Funcionários estimados'].map(c=>valorCampo(r,[c])?c+': '+valorCampo(r,[c]):'')].filter(Boolean).join(' | ')
          if(!nomeEmpresa){erros++;continue}
          const dados={nome:nomeEmpresa,nome_fantasia:null,cnpj:cnpj||null,segmento:segmento||null,status,cidade:cidade||null,estado,telefone:telefone||null,whatsapp:whatsapp||null,email:email||null,observacoes:[contato?'Contato: '+contato:'',observacoes].filter(Boolean).join(' | ')||null}
          const {error}=await supabase.from('empresas').insert([dados])
          if(error) { erros++; console.error('Falha ao importar empresa:',nomeEmpresa,error); }
          else ok++
        }
        await carregarDados()
        if(ok>0) {
          setPagina('empresas')
          window.alert(ok+' empresa(s) salva(s) em Empresas / Leads.'+(erros?' '+erros+' registro(s) falharam; confira o console para detalhes.':''))
        } else {
          setMensagem('Nenhuma empresa foi salva. '+erros+' registro(s) falharam. Confira os nomes das empresas e as permissões de gravação no Supabase.')
        }
      }catch(e){setMensagem('Erro: '+e.message)}
      finally{setImportando(false)}
    }

    return <>
      <div className="page-title"><div><h1>Importar Contatos</h1><p>Importe listas de contatos e clientes diretamente para o CRM.</p></div></div>
      <section className="panel lead-import-panel">
        <h2>Selecionar arquivo</h2>
        <p>Compatível com planilhas Excel antigas e atuais, CSV, ODS, TXT, JSON e contatos VCF/vCard.</p>
        <div className="lead-import-actions">
          <label className="file-import-box">
            <span>{arquivo?arquivo.name:'Selecionar arquivo de contatos'}</span>
            <input type="file" accept=".xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.txt,.json,.vcf,.vcard" onChange={e=>{setArquivo(e.target.files?.[0]||null);setMensagem('')}} />
          </label>
          <button type="button" className="primary" disabled={!arquivo||importando} onClick={importar}>{importando?'Importando...':'Importar para o CRM'}</button>
        </div>
        <p className="import-help"><b>Campos reconhecidos automaticamente:</b> empresa, pessoa de contato, CNPJ, segmento, status, cidade, estado, telefone, WhatsApp, e-mail e observações. Os títulos podem variar, por exemplo: Empresa, Razão Social, Contato, Responsável, Fone, Celular, UF ou E-mail.</p>
        <div className="import-message"><b>PDF, JPG/PNG e Word:</b> podem ser mantidos em Relatórios, mas não são convertidos automaticamente em contatos para evitar cadastros incorretos.</div>
        {mensagem&&<div className="import-message">{mensagem}</div>}
      </section>
    </>
  }

  function Configuracoes() {
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Configurações</h1>
            <p>Informações gerais do CRM.</p>
          </div>
        </div>

        <section className="panel config">
          <h2>Central Truck Service</h2>
          <p><b>Sistema:</b> Central Truck CRM</p>
          <p><b>Banco de dados:</b> Supabase</p>
          <p><b>Hospedagem:</b> GitHub Pages</p>
          <p><b>Moeda:</b> Real brasileiro (BRL)</p>
          <p><b>Idioma:</b> Português do Brasil</p>

          <button className="primary" onClick={carregarDados}>
            Testar conexão com banco
          </button>
        </section>
      </>
    )
  }


  function OrdensServico() {
    const vazio = {numero_os:'',empresa_id:'',servicos:'',pecas:'',produto:'',valor_produto:'',valor:'',forma_pagamento:''}
    const [registros,setRegistros] = useState([])
    const [itensCatalogo,setItensCatalogo] = useState([])
    const [itemSelecionado,setItemSelecionado] = useState('')
    const [quantidadeSelecionada,setQuantidadeSelecionada] = useState('1')
    const [busca,setBusca] = useState(() => localStorage.getItem('centraltruck_os_busca') || '')
    const [filtroMesOS,setFiltroMesOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_mes') || '')
    const [filtroNumeroOS,setFiltroNumeroOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_numero') || '')
    const [form,setForm] = useState(() => { try { return {...vazio,...JSON.parse(localStorage.getItem('centraltruck_os_rascunho') || '{}')} } catch { return vazio } })
    const [editando,setEditando] = useState(() => localStorage.getItem('centraltruck_os_editando') || null)
    const [mensagem,setMensagem] = useState('')
    const [salvando,setSalvando] = useState(false)
    const [mostrarBusca,setMostrarBusca] = useState(false)
    const [carregandoOS,setCarregandoOS] = useState(false)
    useEffect(() => { localStorage.setItem('centraltruck_os_rascunho',JSON.stringify(form)) },[form])
    useEffect(() => { localStorage.setItem('centraltruck_os_busca',busca) },[busca])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_mes',filtroMesOS) },[filtroMesOS])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_numero',filtroNumeroOS) },[filtroNumeroOS])
    useEffect(() => { if(editando) localStorage.setItem('centraltruck_os_editando',editando); else localStorage.removeItem('centraltruck_os_editando') },[editando])
    const registrosFiltrados = registros.filter(item => (!filtroMesOS || String(item.criado_em || '').slice(0,7) === filtroMesOS) && (!filtroNumeroOS || normalizarBusca(item.numero_os).includes(normalizarBusca(filtroNumeroOS.trim()))))
    const selecionada = empresas.find(e=>String(e.id)===String(form.empresa_id))
    const resultados = empresas.filter(e=>normalizarBusca([e.nome_fantasia,e.razao_social,e.nome,e.cnpj,e.telefone,e.whatsapp].join(' ')).includes(normalizarBusca(busca))).slice(0,30)
    async function atualizarOS() {
      setCarregandoOS(true)
      const {data,error}=await supabase.from('ordens_servico').select('*').order('criado_em',{ascending:false})
      setCarregandoOS(false)
      if(error) {setMensagem('Não foi possível consultar as OS: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{atualizarOS()},[])
    useEffect(()=>{supabase.from('catalogo_itens').select('*').order('nome',{ascending:true}).then(({data,error})=>{if(!error)setItensCatalogo(data||[])})},[])
    function adicionarItemCatalogo() {
      const item=itensCatalogo.find(i=>String(i.id)===String(itemSelecionado))
      if(!item){setMensagem('Selecione um produto ou serviço cadastrado.');return}
      const qtd=Math.max(1,Math.floor(Number(quantidadeSelecionada)||1))
      const subtotal=(Number(item.preco)||0)*qtd
      const linha=qtd+' x '+item.nome+' — '+dinheiro(subtotal)
      setForm(v=>item.tipo==='Serviço'
        ?{...v,servicos:[v.servicos,linha].filter(Boolean).join('\n')}
        :{...v,pecas:[v.pecas,linha].filter(Boolean).join('\n'),produto:v.produto||item.nome,valor_produto:(Number(String(v.valor_produto).replace(',','.'))||0)+subtotal})
      setItemSelecionado('');setQuantidadeSelecionada('1');setMensagem('Item incluído. Confira o valor total antes de salvar.')
    }
    function escolherEmpresa(e) {
      setForm(v=>({...v,empresa_id:String(e.id)}))
      setBusca(e.nome_fantasia||e.razao_social||e.nome||'')
      setMostrarBusca(false)
    }
    async function salvar(e) {
      e.preventDefault()
      if(!form.empresa_id) {setMensagem('Selecione um cliente cadastrado na busca.');return}
      setSalvando(true);setMensagem('')
      const payload={numero_os:form.numero_os.trim(),empresa_id:form.empresa_id,servicos:form.servicos,pecas:form.pecas,produto:form.produto,valor_produto:Number(String(form.valor_produto).replace(',','.'))||0,valor:Number(String(form.valor).replace(',','.'))||0,forma_pagamento:form.forma_pagamento}
      const consulta=editando
        ?supabase.from('ordens_servico').update(payload).eq('id',editando)
        :supabase.from('ordens_servico').insert([payload])
      const {error}=await consulta
      setSalvando(false)
      if(error){setMensagem('Erro ao salvar OS: '+error.message);return}
      setForm(vazio);setBusca('');setEditando(null);setMensagem('OS salva com sucesso.')
      await atualizarOS()
    }

    function imprimirPedido(item) {
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))||{}
      const esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
      const campo=(titulo,valor)=>'<div class="campo"><small>'+esc(titulo)+'</small><strong>'+esc(valor||'—')+'</strong></div>'
      const bloco=(titulo,valor)=>'<section><h3>'+esc(titulo)+'</h3><div class="descricao">'+esc(valor||'Não informado')+'</div></section>'
      const data=item.criado_em?dataBR(item.criado_em):dataBR(new Date())
      const nome=cliente.nome_fantasia||cliente.razao_social||cliente.nome||'Cliente cadastrado'
      const total=dinheiro(item.valor)
      const logo=new URL(LOGO,window.location.href).href
      const html=`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pedido de Venda - OS ${esc(item.numero_os)}</title><style>
      @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#20262c;margin:0;font-size:12px}
      header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #19b983;padding-bottom:14px;gap:18px}
      header img{max-width:160px;max-height:78px;object-fit:contain}header .empresa{text-align:right}header .empresa b{font-size:19px;color:#126b54}
      header .empresa p{margin:5px 0;color:#444}h1{font-size:21px;margin:20px 0 5px}h2{font-size:13px;margin:0 0 12px;color:#555;font-weight:normal}
      h3{font-size:13px;background:#e8ecef;padding:9px;margin:18px 0 10px;border-left:4px solid #19b983}
      .grade{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.campo{padding:8px 0;border-bottom:1px solid #ddd;min-width:0;overflow-wrap:anywhere}
      small{display:block;font-size:10px;text-transform:uppercase;color:#666;margin-bottom:4px}.campo strong{font-size:12px;font-weight:600}
      .descricao{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;padding:4px 2px}
      .valor{margin-top:20px;padding:16px;background:#edf5f1;display:flex;justify-content:space-between;font-size:18px;font-weight:bold}
      footer{margin-top:55px;display:flex;gap:40px}footer div{flex:1;text-align:center;border-top:1px solid #777;padding-top:8px;color:#555}
      .acoes{margin:18px 0;display:flex;gap:8px}.acoes button{padding:10px 16px;background:#168b69;color:white;border:0;border-radius:5px;cursor:pointer}
      @media print{.acoes{display:none}header,.valor,h3{-webkit-print-color-adjust:exact;print-color-adjust:exact}section{break-inside:avoid}}
      </style></head><body>
      <div class="acoes"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div>
      <header><img src="${esc(logo)}" alt="Logo Central Truck"><div class="empresa"><b>CENTRAL TRUCK SERVICE</b><p>Oficina especializada em linha diesel</p><p>Contagem - MG</p><p>WhatsApp: (31) 97525-5079</p></div></header>
      <h1>PEDIDO DE VENDA</h1><h2>Ordem de Serviço nº ${esc(item.numero_os)} • Emissão: ${esc(data)}</h2>
      <h3>DADOS DO CLIENTE</h3><div class="grade">
      ${campo('Cliente / Empresa',nome)}${campo('CNPJ',cliente.cnpj)}${campo('Telefone',cliente.telefone||cliente.whatsapp)}
      ${campo('E-mail',cliente.email)}${campo('Cidade / UF',[cliente.cidade,cliente.estado].filter(Boolean).join(' / '))}
      </div>
      ${bloco('SERVIÇOS',item.servicos)}${bloco('PEÇAS E QUANTIDADES',item.pecas)}
      <h3>PRODUTO</h3><div class="grade">${campo('Produto',item.produto)}${campo('Valor do produto',dinheiro(item.valor_produto))}</div>
      <h3>CONDIÇÕES COMERCIAIS</h3><div class="grade">${campo('Forma de pagamento',item.forma_pagamento)}${campo('Data do cadastro',data)}</div>
      <div class="valor"><span>VALOR INFORMADO DA OS</span><span>${esc(total)}</span></div>
      <footer><div>Responsável Central Truck</div><div>Cliente / Responsável</div></footer>
      </body></html>`
      const janela=window.open('','_blank')
      if(!janela){setMensagem('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');return}
      janela.document.open();janela.document.write(html);janela.document.close()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({numero_os:item.numero_os||'',empresa_id:String(item.empresa_id||''),servicos:item.servicos||'',pecas:item.pecas||'',produto:item.produto||'',valor_produto:String(item.valor_produto??''),valor:String(item.valor??''),forma_pagamento:item.forma_pagamento||''})
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))
      setBusca(cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'')
      setMensagem('')
    }
    return <>
      <div className="page-title"><div><h1>Ordens de Serviço</h1><p>Cadastro de OS com vínculo aos clientes existentes.</p></div></div>
      <section className="panel">
        <h2>{editando?'Editar OS':'Nova Ordem de Serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Número da OS *<input required value={form.numero_os} onChange={e=>setForm(v=>({...v,numero_os:e.target.value}))} placeholder="Ex.: 266"/></label>
            <label>Buscar cliente cadastrado *
              <input value={busca} onFocus={()=>setMostrarBusca(true)} onChange={e=>{setBusca(e.target.value);setForm(v=>({...v,empresa_id:''}));setMostrarBusca(true)}} placeholder="Digite nome, CNPJ ou telefone" autoComplete="off"/>
            </label>
          </div>
          {mostrarBusca && <div className="panel" style={{maxHeight:210,overflowY:'auto',padding:8,marginBottom:12}}>
            {resultados.map(e=><button type="button" key={e.id} onClick={()=>escolherEmpresa(e)} style={{display:'block',width:'100%',textAlign:'left',marginBottom:5,background:'#555b63',color:'#fff',border:'1px solid #707780',borderRadius:7}}>{e.nome_fantasia||e.razao_social||e.nome||'Cliente'} — {e.cnpj||e.telefone||e.whatsapp||'Cadastro existente'}</button>)}
            {!resultados.length && <p>Nenhum cliente encontrado. Cadastre em Empresas / Leads.</p>}
          </div>}
          {selecionada && <div className="panel" style={{marginBottom:14,padding:12}}>
            <strong>Cliente vinculado: {selecionada.nome_fantasia||selecionada.razao_social||selecionada.nome}</strong>
            <p>CNPJ: {selecionada.cnpj||'—'} | Telefone: {selecionada.telefone||'—'} | WhatsApp: {selecionada.whatsapp||'—'}</p>
            <p>E-mail: {selecionada.email||'—'} | Cidade: {selecionada.cidade||'—'} / {selecionada.estado||'—'}</p>
          </div>}
          <div className="panel" style={{marginBottom:14,padding:12}}>
            <h3>Adicionar produto ou serviço cadastrado</h3>
            <div className="form-grid">
              <label>Item<select value={itemSelecionado} onChange={e=>setItemSelecionado(e.target.value)}><option value="">Selecione um item</option>{itensCatalogo.map(item=><option key={item.id} value={item.id}>{item.tipo} — {item.nome} — {dinheiro(item.preco)}</option>)}</select></label>
              <label>Quantidade<input type="number" min="1" step="1" value={quantidadeSelecionada} onChange={e=>setQuantidadeSelecionada(e.target.value)}/></label>
            </div>
            <button type="button" onClick={adicionarItemCatalogo}>Adicionar à OS</button>
          </div>
          <div className="form-grid">
            <label>Serviços<textarea rows={4} value={form.servicos} onChange={e=>setForm(v=>({...v,servicos:e.target.value}))} placeholder="Descreva os serviços"/></label>
            <label>Peças<textarea rows={4} value={form.pecas} onChange={e=>setForm(v=>({...v,pecas:e.target.value}))} placeholder="Peças e quantidades"/></label>
            <label>Produto<input value={form.produto} onChange={e=>setForm(v=>({...v,produto:e.target.value}))} placeholder="Nome do produto"/></label>
            <label>Valor do produto (R$)<input type="number" min="0" step="0.01" value={form.valor_produto} onChange={e=>setForm(v=>({...v,valor_produto:e.target.value}))} placeholder="0,00"/></label>
            <label>Valor (R$)<input type="number" min="0" step="0.01" value={form.valor} onChange={e=>setForm(v=>({...v,valor:e.target.value}))}/></label>
            <label>Forma de pagamento<select value={form.forma_pagamento} onChange={e=>setForm(v=>({...v,forma_pagamento:e.target.value}))}>
              <option value="">Selecione</option><option>Pix</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Boleto</option><option>Ticklog</option><option>Faturado</option><option>Transferência bancária</option><option>Outro</option>
            </select></label>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Salvar OS'}</button>
            <button type="button" onClick={()=>{if(!form.numero_os.trim()||!form.empresa_id){setMensagem("Informe o número da OS e selecione um cliente para gerar o pedido.");return} imprimirPedido({...form,numero_os:form.numero_os.trim(),valor:Number(String(form.valor).replace(",","."))||0,valor_produto:Number(String(form.valor_produto).replace(",","."))||0})}} style={{background:"#555b63",color:"#fff",border:"1px solid #737b83",borderRadius:8,padding:"10px 16px",cursor:"pointer"}}>Imprimir / Salvar PDF</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio);setBusca('')}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>OS cadastradas <button type="button" onClick={atualizarOS}>Atualizar</button></h2>
        <div className="form-grid" style={{marginBottom:14}}>
          <label>Buscar por número da OS<input value={filtroNumeroOS} onChange={e=>setFiltroNumeroOS(e.target.value)} placeholder="Ex.: 267" /></label>
          <label>Filtrar por mês<input type="month" value={filtroMesOS} onChange={e=>setFiltroMesOS(e.target.value)} /></label>
        </div>
        {(filtroMesOS || filtroNumeroOS) && <button type="button" onClick={()=>{setFiltroMesOS('');setFiltroNumeroOS('')}} style={{marginBottom:12}}>Limpar filtros</button>}
        {carregandoOS?<p>Carregando...</p>:<table><thead><tr><th>OS</th><th>Cliente</th><th>Serviços</th><th>Peças</th><th>Produto</th><th>Valor do produto</th><th>Valor</th><th>Pagamento</th><th>Ações</th></tr></thead>
          <tbody>{registrosFiltrados.map(item=>{const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id));return <tr key={item.id}>
            <td>{item.numero_os}</td><td>{cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'Cliente cadastrado'}</td>
            <td>{item.servicos}</td><td>{item.pecas}</td><td>{item.produto||'—'}</td><td>{dinheiro(item.valor_produto)}</td><td>{dinheiro(item.valor)}</td><td>{item.forma_pagamento}</td>
            <td><div style={{display:"flex",flexDirection:"column",gap:7,minWidth:125}}><button type="button" className="btn-editar" onClick={()=>editar(item)}>Editar</button><button type="button" style={{background:"#555b63",color:"#fff",border:"1px solid #737b83",borderRadius:8,padding:"9px 12px",cursor:"pointer"}} onClick={()=>imprimirPedido(item)}>Visualizar pedido</button><button type="button" onClick={()=>imprimirPedido(item)}>PDF / Imprimir</button></div></td>
          </tr>})}{!registrosFiltrados.length&&<tr><td colSpan={9}>Nenhuma OS encontrada para os filtros selecionados.</td></tr>}</tbody></table>}
      </section>
    </>
  }


  function Catalogo() {
    const vazio = {tipo:'Produto',nome:'',preco:'',custo:'',preco_manual:false,percentual:'70',quantidade_caixa:'10',quantidade_estoque:'',fornecedor:''}
    const [form,setForm] = useState(()=>{
      try { const salvo=JSON.parse(localStorage.getItem('centraltruck_catalogo_rascunho')||'null');return salvo?.form?{...vazio,...salvo.form}:vazio } catch{return vazio}
    })
    const [registros,setRegistros] = useState([])
    const [editando,setEditando] = useState(()=>{try{return JSON.parse(localStorage.getItem('centraltruck_catalogo_rascunho')||'null')?.editando||null}catch{return null}})
    const [busca,setBusca] = useState('')
    const [tipoFiltro,setTipoFiltro] = useState('Todos')
    const [salvando,setSalvando] = useState(false)
    const [excluindo,setExcluindo] = useState(null)
    const [carregando,setCarregando] = useState(false)
    const [mensagem,setMensagem] = useState('')
    useEffect(()=>{try{localStorage.setItem('centraltruck_catalogo_rascunho',JSON.stringify({form,editando}))}catch{}},[form,editando])
    async function carregar() {
      setCarregando(true)
      const {data,error}=await supabase.from('catalogo_itens').select('*').order('nome',{ascending:true})
      setCarregando(false)
      if(error){setMensagem('Erro ao consultar cadastro: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{carregar()},[])
    async function salvar(e) {
      e.preventDefault()
      setSalvando(true);setMensagem('')
      const payload={
        tipo:form.tipo,nome:form.nome.trim(),
        preco:Number(String(form.preco).replace(',','.'))||0,
        custo:Number(String(form.custo).replace(',','.'))||0,
        quantidade_caixa:form.tipo==='Produto'?Math.max(1,Number(form.quantidade_caixa)||1):1,
        quantidade_estoque:form.tipo==='Produto'?Math.max(0,Number(form.quantidade_estoque)||0):0,
        fornecedor:form.fornecedor.trim()
      }
      const {error}=editando
        ?await supabase.from('catalogo_itens').update(payload).eq('id',editando)
        :await supabase.from('catalogo_itens').insert([payload])
      setSalvando(false)
      if(error){setMensagem('Não foi possível salvar: '+error.message);return}
      setForm(vazio);setEditando(null);localStorage.removeItem('centraltruck_catalogo_rascunho');setMensagem('Cadastro salvo com sucesso.');await carregar()
    }
    async function excluir(item) {
      if(!window.confirm('Excluir definitivamente "'+item.nome+'" do cadastro de produtos e serviços?'))return
      setExcluindo(item.id);setMensagem('')
      const {error}=await supabase.from('catalogo_itens').delete().eq('id',item.id)
      setExcluindo(null)
      if(error){setMensagem('Não foi possível excluir: '+error.message);return}
      if(String(editando)===String(item.id)){setEditando(null);setForm(vazio)}
      setMensagem('Cadastro excluído com sucesso.')
      await carregar()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({tipo:item.tipo||'Produto',nome:item.nome||'',preco:String(item.preco??''),custo:String(item.custo??''),preco_manual:true,percentual:'70',quantidade_caixa:String(item.quantidade_caixa??10),quantidade_estoque:String(item.quantidade_estoque??0),fornecedor:item.fornecedor||''})
      window.scrollTo({top:0,behavior:'smooth'})
    }
    const filtrados=registros.filter(item=>(tipoFiltro==='Todos'||item.tipo===tipoFiltro)&&normalizarBusca([item.nome,item.fornecedor].join(' ')).includes(normalizarBusca(busca)))
    return <>
      <div className="page-title"><div><h1>Cadastro de Produtos e Serviços</h1><p>Catálogo de preços, fornecedores e quantidades da Central Truck.</p></div></div>
      <section className="panel" style={{marginBottom:18}}>
        <h2>Buscar produtos e serviços</h2>
        <div className="form-grid">
          <label>Pesquisar produto, serviço ou fornecedor<input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Digite o nome do produto ou serviço"/></label>
          <label>Mostrar<select value={tipoFiltro} onChange={e=>setTipoFiltro(e.target.value)}><option>Todos</option><option>Produto</option><option>Serviço</option></select></label>
        </div>
        <p style={{marginTop:10,fontSize:13}}>{filtrados.length} cadastro(s) encontrado(s). {busca||tipoFiltro!=='Todos'?'Veja os resultados na lista abaixo.':'Pesquise para localizar um item já cadastrado.'}</p>
        {(busca||tipoFiltro!=='Todos')&&<button type="button" onClick={()=>{setBusca('');setTipoFiltro('Todos')}}>Limpar busca</button>}
      </section>
      <section className="panel">
        <h2>{editando?'Editar cadastro':'Novo produto ou serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Tipo *<select value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))}><option>Produto</option><option>Serviço</option></select></label>
            <label>Nome / descrição *<input required value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))} placeholder="Ex.: Filtro ARLA ou Diagnóstico eletrônico"/></label>
            <label>Valor de custo (R$)<input type="number" min="0" step="0.01" value={form.custo} onChange={e=>setForm(v=>{const custo=e.target.value;const preco=custo===''?'':(Math.round((Number(custo)||0)*(1+(Number(v.percentual)||0)/100)*100)/100).toFixed(2);return {...v,custo,preco:v.preco_manual?v.preco:preco}})} placeholder="0,00"/></label>
            <label>Acréscimo sobre custo (%)<input type="number" min="0" step="0.01" value={form.percentual} onChange={e=>setForm(v=>{const percentual=e.target.value;const preco=v.custo===''?'':(Math.round((Number(v.custo)||0)*(1+(Number(percentual)||0)/100)*100)/100).toFixed(2);return {...v,percentual,preco:v.preco_manual?v.preco:preco}})} placeholder="70"/></label>
            <label>Valor de venda (R$) *<input required type="number" min="0" step="0.01" value={form.preco} onChange={e=>setForm(v=>({...v,preco:e.target.value,preco_manual:true}))} placeholder="Calculado automaticamente"/></label>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',paddingBottom:10}}>
              <span style={{fontSize:12}}>O preço de venda é calculado automaticamente pelo custo e percentual. Também pode ser digitado manualmente.</span>
              <button type="button" onClick={()=>setForm(v=>({...v,preco_manual:false,preco:v.custo===''?'':(Math.round((Number(v.custo)||0)*(1+(Number(v.percentual)||0)/100)*100)/100).toFixed(2)}))}>Recalcular venda</button>
            </div>
            <label>Fornecedor<input value={form.fornecedor} onChange={e=>setForm(v=>({...v,fornecedor:e.target.value}))} placeholder="Nome do fornecedor"/></label>
            {form.tipo==='Produto' && <>
              <label>Unidades por caixa<input type="number" min="1" step="1" value={form.quantidade_caixa} onChange={e=>setForm(v=>({...v,quantidade_caixa:e.target.value}))} placeholder="10"/></label>
              <label>Quantidade em estoque (unidades)<input type="number" min="0" step="1" value={form.quantidade_estoque} onChange={e=>setForm(v=>({...v,quantidade_estoque:e.target.value}))} placeholder="0"/></label>
            </>}
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Cadastrar'}</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio)}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>Produtos e serviços cadastrados <button type="button" onClick={carregar}>Atualizar</button></h2>

        {carregando?<p>Carregando...</p>:<table><thead><tr><th>Tipo</th><th>Produto / Serviço</th><th>Custo</th><th>Venda</th><th>Unid. / caixa</th><th>Estoque</th><th>Fornecedor</th><th>Ações</th></tr></thead><tbody>
          {filtrados.map(item=><tr key={item.id}><td>{item.tipo}</td><td>{item.nome}</td><td>{dinheiro(item.custo)}</td><td>{dinheiro(item.preco)}</td><td>{item.tipo==='Produto'?item.quantidade_caixa:'—'}</td><td>{item.tipo==='Produto'?item.quantidade_estoque:'—'}</td><td>{item.fornecedor||'—'}</td><td><div className="actions"><button type="button" className="btn-editar" onClick={()=>editar(item)}>Editar</button><button type="button" className="btn-excluir" disabled={excluindo===item.id} onClick={()=>excluir(item)}>{excluindo===item.id?"Excluindo...":"Excluir"}</button></div></td></tr>)}
          {!filtrados.length&&<tr><td colSpan={8}>Nenhum cadastro encontrado.</td></tr>}
        </tbody></table>}
      </section>
    </>
  }

  function Conteudo() {
    if (pagina === 'dashboard') return <Dashboard />
    if (pagina === 'empresas') return <Empresas />
    if (pagina === 'funil') return <Funil />
    if (pagina === 'oportunidades') return <Oportunidades />
    if (pagina === 'atendimentos') return <Atendimentos />
    if (pagina === 'agenda') return <Agenda />
    if (pagina === 'orcamentos') return <Orcamentos />
    if (pagina === 'ordens-servico') return <OrdensServico />
    if (pagina === 'catalogo') return <Catalogo />
    if (pagina === 'relatorios') return <Relatorios />
    if (pagina === 'importar') return <ImportarContatos />
    if (pagina === 'configuracoes') return <Configuracoes />
    return <Dashboard />
  }

  return (
    <div className="crm">
      <aside className="sidebar">
        <div className="brand">
          <a href="#" aria-label="Ir para o Dashboard" title="Voltar ao Dashboard" onClick={(event) => { event.preventDefault(); setPagina("dashboard") }} style={{ display: "inline-flex", cursor: "pointer" }}>
            <LogoMark className="brand-logo" />
          </a>
        </div>

        <nav>
          {MENU.map(([id, icone, nome]) => (
            <button
              key={id}
              className={pagina === id ? 'active' : ''}
              onClick={() => setPagina(id)}
            >
              <span>{icone}</span>
              {nome}
            </button>
          ))}
          <button type="button" className="logout-btn" onClick={sair} style={{ width: "100%", marginTop: "12px", textAlign: "left" }}>⇥&nbsp; Sair</button>
        </nav>

        <div className="sidebar-footer">
          <div className="online-dot"></div>
          <div>
            <b>Central Truck</b>
            <span>Sistema online</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="reference-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"24px",flexWrap:"nowrap",position:"relative",width:"100%",boxSizing:"border-box"}}>
          <div className="reference-brand" style={{flex:"0 1 auto",minWidth:0}}>
            <div className="reference-brand-name" style={{fontSize:"clamp(20px, 2.5vw, 34px)",fontWeight:900,letterSpacing:"0.015em",lineHeight:1.05,whiteSpace:"nowrap"}}>CENTRAL TRUCK <span style={{fontSize:"0.46em",letterSpacing:"0.12em",verticalAlign:"middle",whiteSpace:"nowrap"}}>★ SERVICE ★</span></div>
          </div>
          <a className="commercial-phone reference-whatsapp" style={{position:"absolute",right:"18px",top:"50%",transform:"translateY(-50%)",margin:0,flexShrink:0,display:"flex",alignItems:"center",gap:"10px"}} href="https://wa.me/5531975255079" target="_blank" rel="noreferrer">
            <img className="whatsapp-logo-img" src={ZAP_LOGO} alt="WhatsApp" />
            <span className="commercial-copy"><strong>(31) 97525-5079</strong></span>
          </a>
        </header>

        <div className="content">
          {erro && (
            <div className="error-box">
              <b>Não foi possível acessar os dados do Supabase.</b>
              <span>{erro}</span>
              <button onClick={carregarDados}>Tentar novamente</button>
            </div>
          )}

          {carregando ? (
            <div className="loading">
              <div className="loader"></div>
              <b>Carregando Central Truck CRM...</b>
              <span>Buscando informações do banco de dados.</span>
            </div>
          ) : (
            <Conteudo />
          )}
        </div>
      </main>
    </div>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento #root não encontrado no index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
),'Valor Vendido nos Últimos 30 Dias', dinheiro(valorUltimos30Dias)],
      ['R$','Valor em Oportunidades', dinheiro(valorOportunidades)],
      ['↗','Valor Vendido', dinheiro(valorVendido)],
      ['%','Conversão', `${conversao}%`],
      ['◷','Retornos Atrasados', atrasadas],
    ]
    return (
      <div className="dashboard-premium">
        <section className="dash-hero">
          <div>
            <small>Central Truck Service</small>
            <h1>Dashboard Comercial</h1>
            <p>Visão geral da operação comercial Truck exclusivo Danielle</p>
            <button className="primary" onClick={carregarDados}>↻ Atualizar dados</button>
          </div>
          <div className="hero-watermark hero-driving-scene"><img className="hero-truck-image" src={`${import.meta.env.BASE_URL}Caminhão Volvo FH 540 no Galpão Industrial.png`} alt="Volvo FH 540 em movimento" /><span className="truck-motion-streak streak-one" aria-hidden="true"></span><span className="truck-motion-streak streak-two" aria-hidden="true"></span><span className="truck-motion-streak streak-three" aria-hidden="true"></span></div>
        </section>

        <section className="kpi-grid">
          {kpis.map(([icone,titulo,valor]) => (
            <div className="kpi-card clickable-card" key={titulo} role="button" tabIndex="0" onClick={() => { const destinos={'Total de Leads':'empresas','Em Negociação':'funil','Vendas Realizadas':'orcamentos','Valor em Oportunidades':'orcamentos','Valor Vendido':'orcamentos','Conversão':'relatorios','Retornos Atrasados':'agenda'}; setPagina(destinos[titulo] || 'dashboard') }} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')e.currentTarget.click()}}>
              <div className="kpi-icon">{icone}</div>
              <span>{titulo}</span>
              <strong>{valor}</strong>
              <small><b>Central Truck</b> · atualizado</small>
            </div>
          ))}
        </section>

        <div className="dashboard-lower">
          <section className="panel strategic-panel clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('oportunidades')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('oportunidades')}}>
            <div className="panel-heading"><div><h2>Serviços Estratégicos</h2><p>Principais soluções oferecidas pela Central Truck.</p></div></div>
            <div className="service-premium-grid">
              <img
                className="strategic-services-image"
                src={`${import.meta.env.BASE_URL}servicos-estrategicos.jpg`}
                alt="Serviços Estratégicos da Central Truck"
              />
            </div>
          </section>
          <section className="panel commercial-chart clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('relatorios')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('relatorios')}}>
            <div className="panel-heading"><div><h2>Resumo Comercial</h2><p>Evolução das vendas e oportunidades.</p></div></div>
            <div className="mini-bars">
              <div><span>Leads</span><i style={{height:`${Math.min(100,Math.max(8,empresas.length*12))}%`}}></i><b>{empresas.length}</b></div>
              <div><span>Oportunidades</span><i style={{height:`${Math.min(100,Math.max(8,oportunidades.length*16))}%`}}></i><b>{oportunidades.length}</b></div>
              <div><span>Vendas finalizadas</span><i style={{height:`${Math.min(100,Math.max(8,vendas.length*22))}%`}}></i><b>{vendas.length}</b></div>
              <div><span>Orçamentos</span><i style={{height:`${Math.min(100,Math.max(8,orcamentos.length*18))}%`}}></i><b>{orcamentos.length}</b></div>
            </div>
          </section>
        </div>

        <div className="dashboard-lower">
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Últimos Leads</h2><p>Empresas cadastradas recentemente.</p></div><button onClick={()=>setPagina('empresas')}>Ver todos →</button></div>
            {ultimosLeads.length ? ultimosLeads.map((e)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={e.id} onClick={()=>setPagina('empresas')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('empresas')}}><span className="list-avatar">{(e.nome_fantasia||e.nome||'C')[0]}</span><div><b>{e.nome_fantasia||e.nome}</b><small>{e.status||'Lead novo'}</small></div><em>{e.classificacao||'B'}</em></div>) : <div className="dash-empty">Nenhum lead cadastrado.</div>}
          </section>
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Agenda vinculada</h2><p>{tarefas.length} tarefa(s) cadastrada(s) • {proximasTarefas.length} próxima(s) exibida(s).</p></div><button onClick={()=>setPagina('agenda')}>Ver agenda →</button></div>
            {proximasTarefas.length ? proximasTarefas.map((t)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={t.id} onClick={()=>setPagina('agenda')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('agenda')}}><span className="list-avatar">◷</span><div><b>{t.titulo}</b><small>{nomeEmpresa(t.empresa_id)} · {dataBR(t.data_hora)}</small></div><em>{t.prioridade||'Normal'}</em></div>) : <div className="dash-empty">Nenhuma tarefa encontrada no banco de dados. Abra a Agenda para cadastrar ou atualizar.</div>}
          </section>
        </div>
      </div>
    )
  }

 async function baixarPlanilhaClientes() {
  if (!empresas.length) { alert('Não há clientes cadastrados para baixar.'); return }

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Central Truck Service'
  workbook.created = new Date()
  const ws = workbook.addWorksheet('Clientes', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
    },
    views: [{ state: 'frozen', ySplit: 6 }]
  })

  const colunas = [
    ['Empresa',28],['Nome fantasia',28],['CNPJ',20],['Classificação',14],
    ['Segmento',20],['Cidade',20],['Estado',10],['Telefone',18],
    ['WhatsApp',18],['E-mail',30],['Site',28],['Status',20],
    ['Data do cadastro',18],['Observações',40]
  ]
  ws.columns = colunas.map(([header,width]) => ({ header, width }))
  ws.spliceRows(1, 1)
  ws.mergeCells('A1:N3')
  ws.mergeCells('A4:N4')
  ws.mergeCells('A5:N5')
  ws.getCell('A1').value = 'CENTRAL TRUCK SERVICE'
  ws.getCell('A4').value = 'RELATÓRIO DE CLIENTES / LEADS'
  ws.getCell('A5').value = 'Gestão Comercial • Exportado em ' + new Date().toLocaleString('pt-BR')

  const verde = 'FF19E6A2', escuro = 'FF061914', escuro2 = 'FF0B2A21', branco = 'FFFFFFFF', cinza = 'FFDCE9E4'
  ;['A1','A4','A5'].forEach((ref) => {
    ws.getCell(ref).alignment = { vertical:'middle', horizontal:'center' }
    ws.getCell(ref).fill = { type:'pattern', pattern:'solid', fgColor:{argb:escuro} }
    ws.getCell(ref).font = { color:{argb: ref==='A4' ? verde : branco}, bold:true, size: ref==='A1' ? 24 : ref==='A4' ? 16 : 10 }
  })
  ws.getRow(1).height = 32; ws.getRow(2).height = 18; ws.getRow(3).height = 18
  ws.getRow(4).height = 26; ws.getRow(5).height = 22

  const headerRow = ws.getRow(6)
  colunas.forEach(([titulo],i) => headerRow.getCell(i+1).value = titulo)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:verde} }
    cell.font = { color:{argb:'FF00140E'}, bold:true, size:10 }
    cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true }
    cell.border = { bottom:{style:'medium',color:{argb:'FF00A875'}} }
  })

  empresas.forEach((empresa,idx) => {
    const row = ws.addRow([
      empresa.nome || '', empresa.nome_fantasia || '', empresa.cnpj || '',
      empresa.classificacao || '', empresa.segmento || '', empresa.cidade || '',
      empresa.estado || '', empresa.telefone || '', empresa.whatsapp || '',
      empresa.email || '', empresa.site || '', empresa.status || '',
      dataBR(empresa.criado_em), empresa.observacoes || ''
    ])
    row.height = 24
    row.eachCell({includeEmpty:true}, (cell) => {
      cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb: idx%2===0 ? 'FFF5FAF8' : branco} }
      cell.font = { color:{argb:'FF17352C'}, size:10 }
      cell.alignment = { vertical:'middle', wrapText:true }
      cell.border = { bottom:{style:'thin',color:{argb:cinza}} }
    })
  })

  ws.autoFilter = { from:'A6', to:'N' + (empresas.length + 6) }
  ws.headerFooter.oddHeader = '&C&B CENTRAL TRUCK SERVICE'
  ws.headerFooter.oddFooter = '&LRelatório de Clientes&CConfidencial&R&P de &N'
  ws.pageSetup.printTitlesRow = '1:6'
  ws.pageSetup.printArea = 'A1:N' + (empresas.length + 6)

  try {
    const resposta = await fetch(LOGO)
    const blob = await resposta.blob()
    const base64 = await new Promise((resolve,reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const ext = blob.type.includes('png') ? 'png' : 'jpeg'
    const logoId = workbook.addImage({ base64, extension:ext })
    ws.addImage(logoId, { tl:{col:0.15,row:0.15}, ext:{width:125,height:72}, editAs:'oneCell' })
  } catch (e) { console.warn('Logo não inserida no Excel:', e) }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'Clientes_Central_Truck_' + new Date().toISOString().slice(0,10) + '.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

function Empresas() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const formularioEmpresaRef = React.useRef(null)
  const [salvando, setSalvando] = useState(false)
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
   const [empresaEditando, setEmpresaEditando] = useState(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState([])
  const [buscaEmpresa, setBuscaEmpresa] = useState('')
  const [filtroStatusEmpresa, setFiltroStatusEmpresa] = useState('')
  const [buscaAgenda, setBuscaAgenda] = useState('')
  const [form, setForm] = useState({
    nome: '',
    nome_fantasia: '',
    pessoa_contato: '',
    cnpj: '',
    segmento: '',
    classificacao: 'B',
    status: 'Lead novo',
    cidade: '',
    estado: 'MG',
    telefone: '',
    whatsapp: '',
    email: '',
    site: '',
    observacoes: ''
  })

  function limparCadastro() {
    sessionStorage.removeItem('empresa_rascunho')
    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    setEmpresaEditando(null)
    setForm({
      nome: '', nome_fantasia: '', pessoa_contato: '', cnpj: '',
      segmento: '', classificacao: 'B', status: 'Lead novo',
      cidade: '', estado: 'MG', telefone: '', whatsapp: '',
      email: '', site: '', observacoes: ''
    })
  }

  useEffect(() => {
    const rascunho = sessionStorage.getItem('centraltruck_empresa_em_edicao')
    if (rascunho) {
      try {
        const dados = JSON.parse(rascunho)
        if (dados && typeof dados === 'object') {
          setForm(dados)
          setMostrarFormulario(true)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (mostrarFormulario && !empresaEditando && form.nome.trim()) {
      sessionStorage.setItem('centraltruck_empresa_em_edicao', JSON.stringify(form))
    }
  }, [form, mostrarFormulario, empresaEditando])

  function alterarCampo(e) {
    const { name, value } = e.target
    setForm((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }
function editarEmpresa(empresa) {
  setEmpresaEditando(empresa)

  setForm({
    nome: empresa.nome || '',
    nome_fantasia: empresa.nome_fantasia || '',
    pessoa_contato: empresa.pessoa_contato || '',
    cnpj: empresa.cnpj || '',
    segmento: empresa.segmento === 'Diesel' ? 'Oficina - Diesel' : (empresa.segmento || ''),
    classificacao: empresa.classificacao || 'B',
    status: empresa.status || 'Lead novo',
    cidade: empresa.cidade || '',
    estado: empresa.estado || 'MG',
    telefone: empresa.telefone || '',
    whatsapp: empresa.whatsapp || '',
    email: empresa.email || '',
    site: empresa.site || '',
    observacoes: empresa.observacoes || ''
  })

  setMensagem('')
  setMostrarFormulario(true)
  requestAnimationFrame(() => {
    formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
async function excluirSelecionados() {
  if (!leadsSelecionados.length) {
    alert('Selecione pelo menos um Lead.')
    return
  }
  if (!window.confirm('Excluir os ' + leadsSelecionados.length + ' Leads selecionados?')) return

  const lote = 100
  for (let inicio = 0; inicio < leadsSelecionados.length; inicio += lote) {
    const ids = leadsSelecionados.slice(inicio, inicio + lote)

    const funil = await supabase.from('oportunidades').delete().in('empresa_id', ids)
    if (funil.error) {
      alert('Erro ao limpar os vínculos do Funil: ' + funil.error.message)
      await carregarDados()
      return
    }

    const resultado = await supabase.from('empresas').delete().in('id', ids)
    if (resultado.error) {
      alert('Erro ao excluir os Leads selecionados: ' + resultado.error.message)
      await carregarDados()
      return
    }
  }

  setLeadsSelecionados([])
  await carregarDados()
  alert('Leads selecionados excluídos com sucesso.')
}

async function excluirEmpresa(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir esta empresa? Esta ação não poderá ser desfeita.'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('Erro ao excluir empresa: ' + error.message)
    return
  }

  await carregarDados()
}
  async function salvarEmpresa(e) {
    e.preventDefault()

    if (!form.nome.trim()) {
      setMensagem('Informe o nome da empresa.')
      return
    }

    setSalvando(true)
    setMensagem('')

    const { pessoa_contato, ...camposBanco } = form
    const dados = {
      ...camposBanco,
      nome: form.nome.trim(),
      nome_fantasia: form.nome_fantasia.trim() || null,
      cnpj: form.cnpj.trim() || null,
      segmento: form.segmento.trim() || null,
      cidade: form.cidade.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      observacoes: form.observacoes.trim() || null
    }

    let resultado

if (empresaEditando) {
  resultado = await supabase
    .from('empresas')
    .update(dados)
    .eq('id', empresaEditando.id)
} else {
  resultado = await supabase
    .from('empresas')
    .insert([dados])
    .select('id')
}

const { error } = resultado


    if (error) {
      console.error(error)
      setMensagem('Erro ao cadastrar empresa: ' + error.message)
      setSalvando(false)
      return
    }

    setMensagem(empresaEditando ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!')
    sessionStorage.removeItem('empresa_rascunho')

    setForm({
      nome: '',
      nome_fantasia: '',
      pessoa_contato: '',
      cnpj: '',
      segmento: '',
      classificacao: 'B',
      status: 'Lead novo',
      cidade: '',
      estado: 'MG',
      telefone: '',
      whatsapp: '',
      email: '',
      site: '',
      observacoes: ''
    })

    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    await carregarDados()
    setSalvando(false)
    setEmpresaEditando(null)
    // Manter o formulario aberto e limpo para o proximo cadastro.
    setMostrarFormulario(true)
    requestAnimationFrame(() => {
      formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Empresas / Leads</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.4' }}>Base comercial de clientes e potenciais clientes.</p>
        </div>

        <button
          className="primary"
          onClick={() => {
            setMensagem('')
            if (mostrarFormulario) {
              setMostrarFormulario(false)
              limparCadastro()
            } else {
              limparCadastro()
              setMostrarFormulario(true)
            }
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nova Empresa'}
        </button>
        <button type="button" className="btn-exportar" onClick={baixarPlanilhaClientes}>
          ↓ Baixar planilha de clientes
        </button>
      </div>

      {mensagem && (
        <section className="panel" style={{ marginBottom: '16px' }}>
          <strong>{mensagem}</strong>
        </section>
      )}

      {mostrarFormulario && (
        <section ref={formularioEmpresaRef} className="panel" style={{ marginBottom: '20px', scrollMarginTop: '24px' }}>
          <h2>{empresaEditando ? 'Editar Empresa' : 'Nova Empresa'}</h2>

          <form onSubmit={salvarEmpresa}>
            <div className="form-grid">
              <label>
                Nome da empresa *
                <input
                  name="nome"
                  value={form.nome}
                  onChange={alterarCampo}
                  required
                />
              </label>

              <label>
                Pessoa de contato
                <input
                  name="pessoa_contato"
                  value={form.pessoa_contato}
                  onChange={alterarCampo}
                  placeholder="Ex.: Gustavo"
                />
              </label>

              <label>
                CNPJ
                <input
                  name="cnpj"
                  value={form.cnpj}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Segmento
                <select
                  name="segmento"
                  value={form.segmento}
                  onChange={alterarCampo}
                >
                  <option value="">Selecione o segmento</option>
                  <option value="Transportadora">Transportadora</option>
                  <option value="Frota Própria">Frota Própria</option>
                  <option value="Frota Terceirizada">Frota Terceirizada</option>
                  <option value="Troca de Óleo">Troca de Óleo</option>
                  <option value="Oficina - Diesel">Oficina - Diesel</option>
                  <option value="Elétrica">Elétrica</option>
                  <option value="Pessoa Física">Pessoa Física</option>
                </select>
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={alterarCampo}
                >
                  <option>Lead novo</option>
                  <option>Primeiro contato</option>
                  <option>Interessado</option>
                  <option>Visita agendada</option>
                  <option>Orçamento enviado</option>
                  <option>Em negociação</option>
                  <option>Venda realizada</option>
                  <option>Venda perdida</option>
                  <option>Pós-venda</option>
                  <option>Já é cliente</option>
                  <option>Concorrente</option>
                  <option>Futuro parceiro</option>
                  <option>Não atendeu, ligar novamente</option>
                  <option>Cliente de outro vendedor</option>
                  </select>
              </label>

              <label>
                Cidade
                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Estado
                <input
                  name="estado"
                  value={form.estado}
                  onChange={alterarCampo}
                  maxLength="2"
                />
              </label>

              <label>
                Telefone
                <input
                  name="telefone"
                  value={form.telefone}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                WhatsApp
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={alterarCampo}
                />
              </label>
            </div>

            <label style={{ display: 'block', marginTop: '14px' }}>
              Observações
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={alterarCampo}
                rows="4"
              />
            </label>

            <div style={{ marginTop: '12px', color: 'var(--muted)', fontSize: '13px' }}>Após salvar, você poderá selecionar esta empresa na seção “Agendar novo contato” abaixo.</div>
            <div style={{ marginTop: '16px' }}>
              <button
                className="primary"
                type="submit"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Empresa'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel" style={{ marginBottom: '16px' }}>
        <h3>Agendar novo contato</h3>
        <p>Selecione uma empresa cadastrada para criar um retorno diretamente na Agenda.</p>
        <input aria-label="Buscar empresa para agendar" placeholder="🔎 Buscar empresa pelo nome..." value={buscaAgenda} onChange={e => setBuscaAgenda(e.target.value)} style={{width:'100%',maxWidth:'480px',marginBottom:'8px'}} />
        <select id="empresa-agenda-rapida" defaultValue="" style={{ width: '100%', maxWidth: '480px', marginRight: '12px' }}>
          <option value="">Selecione uma empresa</option>
          {empresas.filter(empresa => normalizarBusca(empresa.nome_fantasia || empresa.nome).includes(normalizarBusca(buscaAgenda))).map(empresa => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia || empresa.nome}</option>)}
        </select>
        <button type="button" className="primary" style={{ background: '#444B54', backgroundColor: '#444B54', color: '#FFFFFF', border: '1px solid #626A74' }} onClick={() => {
          const id = document.getElementById('empresa-agenda-rapida')?.value
          if (!id) { alert('Selecione uma empresa antes de agendar.'); return }
          sessionStorage.setItem('centraltruck_agendar_empresa', id)
          setPagina('agenda')
        }}>+ Agendar novo contato</button>
      </section>

      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px'}}>
        <input aria-label="Buscar na lista de empresas" placeholder="🔎 Buscar cliente, telefone, cidade ou observações..." value={buscaEmpresa} onChange={e => setBuscaEmpresa(e.target.value)} style={{flex:'2 1 320px',minWidth:0}} />
        <select aria-label="Filtrar clientes por situação" value={filtroStatusEmpresa} onChange={e => setFiltroStatusEmpresa(e.target.value)} style={{flex:'1 1 220px',minWidth:0}}>
          <option value="">Todas as situações</option>
          <option value="Não atendeu, ligar novamente">Não atendeu / ligar novamente</option>
          {[...new Set(empresas.map(e => e.status).filter(Boolean))].filter(status => status !== 'Não atendeu, ligar novamente').sort((a,b)=>a.localeCompare(b,'pt-BR')).map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        {(buscaEmpresa || filtroStatusEmpresa) && <button type="button" onClick={()=>{setBuscaEmpresa('');setFiltroStatusEmpresa('')}}>Limpar filtros</button>}
      </div>
      <section className="panel table-wrap">
        {leadsSelecionados.length > 0 && (
          <div className="selection-toolbar">
            <strong>{leadsSelecionados.length} selecionado(s)</strong>
            <button type="button" className="btn-excluir" onClick={excluirSelecionados}>Excluir selecionados</button>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th className="select-col"><input type="checkbox" aria-label="Selecionar todos" checked={empresas.length > 0 && leadsSelecionados.length === empresas.length} onChange={(e)=>setLeadsSelecionados(e.target.checked ? empresas.map((item)=>item.id) : [])} /></th>
              <th>Empresa</th>
              <th>Segmento</th>
              <th>Cidade</th>
              <th>Telefone</th>
              <th>Status</th><th>Data do cadastro</th><th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {empresas.length > 0 ? (
              empresas.filter(empresa => (!filtroStatusEmpresa || empresa.status === filtroStatusEmpresa) && normalizarBusca([empresa.nome, empresa.nome_fantasia, empresa.telefone, empresa.whatsapp, empresa.cidade, empresa.segmento, empresa.status, empresa.pessoa_contato, empresa.observacoes].join(' ')).includes(normalizarBusca(buscaEmpresa))).map((empresa) => (
                <tr key={empresa.id}>
                  <td className="select-col"><input type="checkbox" aria-label={'Selecionar ' + (empresa.nome_fantasia || empresa.nome)} checked={leadsSelecionados.includes(empresa.id)} onChange={(e)=>setLeadsSelecionados((atuais)=>e.target.checked ? [...atuais, empresa.id] : atuais.filter((id)=>id !== empresa.id))} /></td>
                  <td>{empresa.nome}</td>
                  <td>{empresa.segmento || '-'}</td>
                  <td>
                    {empresa.cidade || '-'}
                    {empresa.estado ? ` / ${empresa.estado}` : ''}
                  </td>
                  <td>{empresa.telefone || empresa.whatsapp || '-'}</td>
                 <td>{empresa.status || '-'}</td>
<td>{dataBR(empresa.criado_em)}</td>
<td>
 
  <button
    type="button"
    onClick={() => editarEmpresa(empresa)}
    className="btn-editar"
  >
    Editar
  </button>

  <button
    type="button"
    onClick={() => excluirEmpresa(empresa.id)}
    className="btn-excluir"
  >
    Excluir
  </button>
</td>
                </tr>
              ))
            ) : (
              <tr>
<td colSpan="8" style={{ textAlign: 'center' }}>                 
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}

function Decisores() {
  const [contatos, setContatos] = useState([])
const [empresas, setEmpresas] = useState([])
const [mostrarFormDecisor, setMostrarFormDecisor] = useState(false)
const [salvandoDecisor, setSalvandoDecisor] = useState(false)
const [mensagemDecisor, setMensagemDecisor] = useState('')
    const [decisorEditandoId, setDecisorEditandoId] = useState(null)

const [formDecisor, setFormDecisor] = useState({
  empresa_id: '',
  nome: '',
  cargo: '',
  telefone: '',
  whatsapp: '',
  email: ''
})

    async function carregarDecisores() {
    const { data, error } = await supabase
      .from('contatos')
      .select(`
        *,
        empresas (
          nome
        )
      `)
      .order('nome')

    if (error) {
      console.error('Erro ao carregar decisores:', error)
      return
    }

    setContatos(data || [])
  }

  async function carregarEmpresasDecisor() {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome')
      .order('nome')

    if (error) {
      console.error('Erro ao carregar empresas:', error)
      return
    }

    setEmpresas(data || [])
  }

  useEffect(() => {
    carregarDecisores()
    carregarEmpresasDecisor()
  }, [])
    async function salvarDecisor(e) {
    e.preventDefault()
    setSalvandoDecisor(true)
    setMensagemDecisor('')

    if (!formDecisor.empresa_id || !formDecisor.nome) {
      setMensagemDecisor('Selecione a empresa e informe o nome do decisor.')
      setSalvandoDecisor(false)
      return
    }

    const dadosDecisor = {
      empresa_id: formDecisor.empresa_id,
      nome: formDecisor.nome,
      cargo: formDecisor.cargo || null,
      telefone: formDecisor.telefone || null,
      whatsapp: formDecisor.whatsapp || null,
      email: formDecisor.email || null,
      principal: true
    }
    const consultaDecisor = decisorEditandoId
      ? supabase.from('contatos').update(dadosDecisor).eq('id', decisorEditandoId)
      : supabase.from('contatos').insert([dadosDecisor])
    const { error } = await consultaDecisor

    if (error) {
      console.error('Erro ao salvar decisor:', error)
alert('Erro ao salvar decisor: ' + error.message)
  setSalvandoDecisor(false)
      return
    }

    setFormDecisor({
      empresa_id: '',
      nome: '',
      cargo: '',
      telefone: '',
      whatsapp: '',
      email: ''
    })

    setMensagemDecisor(decisorEditandoId ? 'Decisor atualizado com sucesso!' : 'Decisor cadastrado com sucesso!')
    setDecisorEditandoId(null)
    setMostrarFormDecisor(false)
    setSalvandoDecisor(false)
    await carregarDecisores()
  }

  function editarDecisor(contato) {
    setFormDecisor({
      empresa_id: contato.empresa_id || '',
      nome: contato.nome || '',
      cargo: contato.cargo || '',
      telefone: contato.telefone || '',
      whatsapp: contato.whatsapp || '',
      email: contato.email || ''
    })
    setDecisorEditandoId(contato.id)
    setMostrarFormDecisor(true)
  }

  async function excluirDecisor(id) {
  const confirmar = window.confirm('Tem certeza que deseja excluir este decisor?')

  if (!confirmar) return

  const { error } = await supabase
    .from('contatos')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir decisor: ' + error.message)
    return
  }

  await carregarDecisores()
}
  
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Decisores</h1>
            <p>Contatos responsáveis pelas decisões comerciais.</p>
          </div>
          <button
  className="btn-primary"
  onClick={() => { setDecisorEditandoId(null); setFormDecisor({ empresa_id:'', nome:'', cargo:'', telefone:'', whatsapp:'', email:'' }); setMostrarFormDecisor(true) }}
>
  + Novo Decisor
</button>
        </div>

        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Cargo</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>WhatsApp</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contatos.map((contato) => (
                <tr key={contato.id}>
                  <td><b>{contato.nome}</b></td>
                  <td>{nomeEmpresa(contato.empresa_id)}</td>
                  <td>{contato.cargo || '—'}</td>
                  <td>{contato.telefone || '—'}</td>
                  <td>{contato.email || '—'}</td>
                  <td>
                    {contato.whatsapp ? (
                      <a
                        className="whatsapp"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://wa.me/55${String(
                          contato.whatsapp
                        ).replace(/\D/g, '')}`}
                      >
                        Abrir WhatsApp
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                
        <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarDecisor(contato)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirDecisor(contato.id)}>Excluir</button></div></td>
  </tr>           
      ))}
              {!contatos.length && (
                <tr>
                  <td colSpan="7" className="empty">
                    Nenhum decisor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        {mostrarFormDecisor && (
  <section className="panel">
    <h2>{decisorEditandoId ? 'Editar Decisor' : 'Novo Decisor'}</h2>

<form onSubmit={salvarDecisor}>
  <label>Empresa</label>
      <select
        value={formDecisor.empresa_id}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, empresa_id: e.target.value })
        }
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome}
          </option>
        ))}
      </select>

      <label>Nome</label>
      <input
        type="text"
        value={formDecisor.nome}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, nome: e.target.value })
        }
      />

      <label>Cargo</label>
      <input
        type="text"
        value={formDecisor.cargo}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, cargo: e.target.value })
        }
      />

      <label>Telefone</label>
      <input
        type="text"
        value={formDecisor.telefone}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, telefone: e.target.value })
        }
      />

      <label>WhatsApp</label>
      <input
        type="text"
        value={formDecisor.whatsapp}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, whatsapp: e.target.value })
        }
      />

      <label>E-mail</label>
      <input
        type="email"
        value={formDecisor.email}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, email: e.target.value })
        }
      />

     <button type="submit" className="btn-primary" disabled={salvandoDecisor}>
{salvandoDecisor ? 'Salvando...' : 'Salvar Decisor'}
     </button>

      <button
        type="button"
        onClick={() => setMostrarFormDecisor(false)}
      >
        Cancelar
      </button>
    </form>
  </section>
)}
      </>
    )
  }

  async function excluirOportunidade(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta oportunidade?')) return
    const { error } = await supabase.from('oportunidades').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir oportunidade: ' + error.message)
      return
    }
    await carregarDados()
  }

  function Funil() {
    const [agendamentosFunil, setAgendamentosFunil] = useState({})

    async function agendarEEnviarWhatsApp(item) {
      const dataHora = agendamentosFunil[item.id]
      if (!dataHora) {
        alert('Selecione a data e a hora do agendamento.')
        return
      }

      const empresaNome = nomeEmpresa(item.empresa_id)
      const dataFormatada = new Date(dataHora).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })

      const { error } = await supabase.from('tarefas').insert([{
        empresa_id: item.empresa_id || null,
        titulo: 'Agendamento - ' + (item.titulo || empresaNome),
        descricao: 'Agendamento criado pelo Funil Comercial. Etapa: ' + item.etapa,
        data_hora: dataHora,
        prioridade: 'Normal',
        status: 'Pendente'
      }])

      if (error) {
        alert('Erro ao salvar o agendamento: ' + error.message)
        return
      }

      await carregarDados()

      const mensagem = [
        '📅 *AGENDAMENTO CENTRAL TRUCK*',
        '',
        'Empresa: ' + empresaNome,
        'Oportunidade: ' + (item.titulo || '-'),
        'Etapa: ' + item.etapa,
        'Data e hora: ' + dataFormatada
      ].join('\n')

      window.open('https://wa.me/5531975255079?text=' + encodeURIComponent(mensagem), '_blank', 'noopener,noreferrer')
    }

    const etapas = [
      'Lead Novo',
      'Primeiro Contato',
      'Interessado',
      'Visita Agendada',
      'Orçamento Enviado',
      'Em Negociação',
      'Venda Realizada',
      'Venda Perdida',
      'Pós-venda',
    ]


    async function moverOportunidade(id, novaEtapa) {
  const { error } = await supabase
    .from('oportunidades')
    .update({ etapa: novaEtapa })
    .eq('id', id)

  if (error) {
    alert('Erro ao alterar etapa: ' + error.message)
    return
  }

  await carregarDados()
}
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Funil Comercial</h1>
            <p>Acompanhamento das oportunidades por etapa.</p>
          </div>
        </div>

        <div className="kanban">
          {etapas.map((etapa) => {
            const itens = oportunidades.filter((o) => o.etapa === etapa)

            return (
              <div className="kanban-column" key={etapa}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.outline = '2px solid #19df91' }}
                onDragLeave={(e) => { e.currentTarget.style.outline = '' }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.outline = ''
                  const id = e.dataTransfer.getData('text/plain')
                  const item = oportunidades.find(o => String(o.id) === id)
                  if (item && item.etapa !== etapa) moverOportunidade(item.id, etapa)
                }}>
                <div className="kanban-title">
                  <b>{etapa}</b>
                  <span>{itens.length}</span>
                </div>

                {itens.map((item) => (
                 <details className="deal" key={item.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(item.id)); e.dataTransfer.effectAllowed = "move" }} style={{padding:"10px 12px",minHeight:0,cursor:"grab"}}>
  <summary style={{cursor:"pointer",fontWeight:700,listStyle:"revert",overflowWrap:"anywhere"}}>{nomeEmpresa(item.empresa_id) || item.titulo}</summary>
  <div style={{display:"grid",gap:"8px",marginTop:"12px"}}>
  <b>{item.titulo || nomeEmpresa(item.empresa_id)}</b>
  <strong>{dinheiro(item.valor_estimado)}</strong>



  <label className="deal-schedule-label">
    Data e hora do agendamento
    <input
      className="deal-schedule-input"
      type="datetime-local"
      value={agendamentosFunil[item.id] || ''}
      onChange={(e) => setAgendamentosFunil({ ...agendamentosFunil, [item.id]: e.target.value })}
    />
  </label>
  <button type="button" className="btn-whatsapp" onClick={() => agendarEEnviarWhatsApp(item)}>
    Agendar e enviar no WhatsApp
  </button>
  <button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button>
</div>
</details>
                ))}

                {!itens.length && (
                  <div className="kanban-empty">Nenhuma oportunidade</div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  function Oportunidades() {
      const [mostrarFormOportunidade, setMostrarFormOportunidade] = useState(false)
  const [salvandoOportunidade, setSalvandoOportunidade] = useState(false)
  const [mensagemOportunidade, setMensagemOportunidade] = useState('')
  const [selecionadas, setSelecionadas] = useState([])
  const [excluindoLote, setExcluindoLote] = useState(false)
  async function excluirSelecionadas() {
    if (!selecionadas.length || excluindoLote) return
    if (!window.confirm('Excluir definitivamente ' + selecionadas.length + ' oportunidade(s) selecionada(s)? Os cadastros das empresas serão preservados.')) return
    setExcluindoLote(true)
    const {error} = await supabase.from('oportunidades').delete().in('id', selecionadas)
    setExcluindoLote(false)
    if (error) { alert('Não foi possível excluir: ' + error.message); return }
    setSelecionadas([])
    await carregarDados()
  }

  const [formOportunidade, setFormOportunidade] = useState({
    empresa_id: '',
    titulo: '',
    servico: '',
    etapa: 'Lead Novo',
    valor_estimado: '',
    probabilidade: 0,
    previsao_fechamento: '',
    observacoes: ''
  })

  async function salvarOportunidade(e) {
    e.preventDefault()

    if (!formOportunidade.empresa_id || !formOportunidade.titulo) {
      setMensagemOportunidade('Selecione a empresa e informe o título da oportunidade.')
      return
    }

    setSalvandoOportunidade(true)
    setMensagemOportunidade('')

    const { error } = await supabase
      .from('oportunidades')
      .insert([{
        empresa_id: formOportunidade.empresa_id,
        titulo: formOportunidade.titulo,
        servico: formOportunidade.servico || null,
        etapa: formOportunidade.etapa,
        valor_estimado: formOportunidade.valor_estimado
          ? Number(formOportunidade.valor_estimado)
          : null,
        probabilidade: Number(formOportunidade.probabilidade) || 0,
        previsao_fechamento: formOportunidade.previsao_fechamento || null,
        observacoes: formOportunidade.observacoes || null
      }])

    if (error) {
      alert('Erro ao salvar oportunidade: ' + error.message)
      setSalvandoOportunidade(false)
      return
    }

    setFormOportunidade({
      empresa_id: '',
      titulo: '',
      servico: '',
      etapa: 'Lead Novo',
      valor_estimado: '',
      probabilidade: 0,
      previsao_fechamento: '',
      observacoes: ''
    })

    setMensagemOportunidade('Oportunidade cadastrada com sucesso!')
    setMostrarFormOportunidade(false)
    setSalvandoOportunidade(false)

    await carregarDados()
  }
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Oportunidades</h1>
            <p>Negociações comerciais em andamento.</p>
          </div>
        </div>
<button
  type="button"
  className="btn-primary"
  onClick={() => setMostrarFormOportunidade(true)}
>
  + Nova Oportunidade
</button>
<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginTop:12,marginBottom:12}}>
  <button type="button" onClick={()=>setSelecionadas(oportunidades.map(o=>o.id))}>Selecionar todas</button>
  <button type="button" onClick={()=>setSelecionadas([])}>Limpar seleção</button>
  <button type="button" className="btn-excluir" disabled={!selecionadas.length || excluindoLote} onClick={excluirSelecionadas}>
    {excluindoLote ? 'Excluindo...' : 'Excluir selecionadas ('+selecionadas.length+')'}
  </button>
</div>

{mensagemOportunidade && (
  <p>{mensagemOportunidade}</p>
)}
        {mostrarFormOportunidade && (
  <section className="panel">
    <h2>Nova Oportunidade</h2>

    <form onSubmit={salvarOportunidade}>

      <label>Empresa</label>
      <select
        value={formOportunidade.empresa_id}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            empresa_id: e.target.value
          })
        }
        required
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome_fantasia || empresa.nome}
          </option>
        ))}
      </select>

      <label>Título da oportunidade</label>
      <input
        type="text"
        value={formOportunidade.titulo}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            titulo: e.target.value
          })
        }
        placeholder="Ex.: Manutenção sistema ARLA"
        required
      />

      <label>Serviço</label>
      <select
        value={formOportunidade.servico}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            servico: e.target.value
          })
        }
      >
        <option value="">Selecione</option>
        <option value="Catalisador">Catalisador</option>
        <option value="ARLA 32">ARLA 32</option>
        <option value="Diálise">Diálise</option>
        <option value="Diagnóstico">Diagnóstico</option>
        <option value="Sistema SCR">Sistema SCR</option>
        <option value="DPF">DPF</option>
        <option value="Injeção Diesel">Injeção Diesel</option>
        <option value="Elétrica">Elétrica</option>
        <option value="Mecânica Diesel">Mecânica Diesel</option>
      </select>

      <label>Etapa</label>
      <select
        value={formOportunidade.etapa}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            etapa: e.target.value
          })
        }
      >
        <option value="Lead Novo">Lead Novo</option>
        <option value="Primeiro Contato">Primeiro Contato</option>
        <option value="Interessado">Interessado</option>
        <option value="Visita Agendada">Visita Agendada</option>
        <option value="Orçamento Enviado">Orçamento Enviado</option>
        <option value="Em Negociação">Em Negociação</option>
        <option value="Venda Realizada">Venda Realizada</option>
        <option value="Venda Perdida">Venda Perdida</option>
        <option value="Pós-venda">Pós-venda</option>
                  <option value="Já é cliente">Já é cliente</option>
      </select>

      <label>Valor estimado (R$)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={formOportunidade.valor_estimado}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            valor_estimado: e.target.value
          })
        }
      />

      <label>Probabilidade (%)</label>
      <input
        type="number"
        min="0"
        max="100"
        value={formOportunidade.probabilidade}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            probabilidade: e.target.value
          })
        }
      />

      <label>Previsão de fechamento</label>
      <input
        type="date"
        value={formOportunidade.previsao_fechamento}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            previsao_fechamento: e.target.value
          })
        }
      />

      <label>Observações</label>
      <textarea
        value={formOportunidade.observacoes}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            observacoes: e.target.value
          })
        }
      />

      <div>
        <button
          type="submit"
          className="btn-primary"
          disabled={salvandoOportunidade}
        >
          {salvandoOportunidade ? 'Salvando...' : 'Salvar Oportunidade'}
        </button>

        <button
          type="button"
          onClick={() => setMostrarFormOportunidade(false)}
        >
          Cancelar
        </button>
      </div>

    </form>
  </section>
)}
        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Selecionar todas as oportunidades" checked={oportunidades.length>0 && oportunidades.every(o=>selecionadas.includes(o.id))} onChange={e=>setSelecionadas(e.target.checked?oportunidades.map(o=>o.id):[])} /></th>
                <th>Oportunidade</th>
                <th>Empresa</th>
                <th>Serviço</th>
                <th>Etapa</th>
                <th>Valor</th>
                <th>Probabilidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" aria-label={'Selecionar '+(item.titulo||'oportunidade')} checked={selecionadas.includes(item.id)} onChange={e=>setSelecionadas(v=>e.target.checked?[...v,item.id]:v.filter(id=>id!==item.id))}/></td>
                  <td><b>{item.titulo || 'Oportunidade'}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.servico || '—'}</td>
                  <td><span className="status">{item.etapa}</span></td>
                  <td>{dinheiro(item.valor_estimado)}</td>
                  <td>{item.probabilidade || 0}%</td>
                  <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarOportunidade(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button></div></td>
                </tr>
              ))}

              {!oportunidades.length && (
                <tr>
                  <td colSpan="8" className="empty">
                    Nenhuma oportunidade cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </>
    )
  }
function Atendimentos() {
  const [mostrarFormAtendimento, setMostrarFormAtendimento] = useState(false)
const [salvandoAtendimento, setSalvandoAtendimento] = useState(false)
const [mensagemAtendimento, setMensagemAtendimento] = useState('')
const [atendimentoEditandoId, setAtendimentoEditandoId] = useState(null)

const [formAtendimento, setFormAtendimento] = useState({
  empresa_id: '',
  tipo: 'Ligação',
  descricao: '',
  data_atividade: new Date().toISOString().slice(0, 10),
  proximo_retorno: '',
  concluido: false
})

function editarAtendimento(item) {
  setFormAtendimento({
    empresa_id: item.empresa_id || '',
    tipo: item.tipo || 'Ligação',
    descricao: item.descricao || '',
    data_atividade: item.data_atividade ? String(item.data_atividade).slice(0,10) : new Date().toISOString().slice(0,10),
    proximo_retorno: item.proximo_retorno ? String(item.proximo_retorno).slice(0,10) : '',
    concluido: !!item.concluido
  })
  setAtendimentoEditandoId(item.id)
  setMostrarFormAtendimento(true)
}

async function excluirAtendimento(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir este atendimento?'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('atividades')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir atendimento: ' + error.message)
    return
  }

  await carregarDados()
} 
  async function salvarAtendimento(e) {
  e.preventDefault()

  if (!formAtendimento.empresa_id || !formAtendimento.descricao) {
    alert('Selecione a empresa e informe a descrição do atendimento.')
    return
  }

  setSalvandoAtendimento(true)

  const dadosAtendimento = {
    empresa_id: Number(formAtendimento.empresa_id),
    tipo: formAtendimento.tipo,
    descricao: formAtendimento.descricao,
    data_atividade: formAtendimento.data_atividade,
    proximo_retorno: formAtendimento.proximo_retorno || null,
    concluido: formAtendimento.concluido
  }
  const consultaAtendimento = atendimentoEditandoId
    ? supabase.from('atividades').update(dadosAtendimento).eq('id', atendimentoEditandoId)
    : supabase.from('atividades').insert([dadosAtendimento])
  const { error } = await consultaAtendimento

  if (error) {
    alert('Erro ao salvar atendimento: ' + error.message)
    setSalvandoAtendimento(false)
    return
  }

  setMensagemAtendimento(atendimentoEditandoId ? 'Atendimento atualizado com sucesso!' : 'Atendimento registrado com sucesso!')
  setAtendimentoEditandoId(null)
  setMostrarFormAtendimento(false)
  setSalvandoAtendimento(false)

  setFormAtendimento({
    empresa_id: '',
    tipo: 'Ligação',
    descricao: '',
    data_atividade: new Date().toISOString().slice(0, 10),
    proximo_retorno: '',
    concluido: false
  })

  await carregarDados()
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Atendimentos</h1>
          <p>Histórico de contatos e atividades comerciais.</p>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={() => { setAtendimentoEditandoId(null); setFormAtendimento({ empresa_id:'', tipo:'Ligação', descricao:'', data_atividade:new Date().toISOString().slice(0,10), proximo_retorno:'', concluido:false }); setMostrarFormAtendimento(true) }}
      >
        + Novo Atendimento
      </button>

      {mensagemAtendimento && (
        <p>{mensagemAtendimento}</p>
      )}

      {mostrarFormAtendimento && (
        <section className="panel">
          <form onSubmit={salvarAtendimento}>

            <label>Empresa</label>
            <select
              value={formAtendimento.empresa_id}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  empresa_id: e.target.value
                })
              }
              required
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>

            <label>Tipo de atendimento</label>
            <select
              value={formAtendimento.tipo}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  tipo: e.target.value
                })
              }
            >
              <option value="Ligação">Ligação</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Visita">Visita</option>
              <option value="E-mail">E-mail</option>
              <option value="Reunião">Reunião</option>
              <option value="Orçamento">Orçamento</option>
              <option value="Observação">Observação</option>
            </select>

            <label>Descrição</label>
            <textarea
              value={formAtendimento.descricao}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  descricao: e.target.value
                })
              }
              placeholder="Descreva o atendimento realizado..."
              required
            />

            <label>Data do atendimento</label>
            <input
              type="date"
              value={formAtendimento.data_atividade}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  data_atividade: e.target.value
                })
              }
            />

            <label>Próximo retorno</label>
            <input
              type="date"
              value={formAtendimento.proximo_retorno}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  proximo_retorno: e.target.value
                })
              }
            />

            <label>
              <input
                type="checkbox"
                checked={formAtendimento.concluido}
                onChange={(e) =>
                  setFormAtendimento({
                    ...formAtendimento,
                    concluido: e.target.checked
                  })
                }
              />
              Atendimento concluído
            </label>

            <div>
              <button
                type="submit"
                className="btn-primary"
                disabled={salvandoAtendimento}
              >
                {salvandoAtendimento ? 'Salvando...' : 'Salvar Atendimento'}
              </button>

              <button
                type="button"
                onClick={() => setMostrarFormAtendimento(false)}
              >
                Cancelar
              </button>
            </div>

          </form>
        </section>
      )}

      <section className="panel">
        {atividades.map((item) => (
          <div className="activity" key={item.id}>
            <div className="activity-icon"></div>

            <div>
              <b>{item.tipo || 'Atendimento'}</b>
              <span>{nomeEmpresa(item.empresa_id)}</span>
              <p>{item.descricao || 'Sem descrição.'}</p>

              {item.proximo_retorno && (
                <p>
                  Próximo retorno: {dataBR(item.proximo_retorno)}
                </p>
              )}
            </div>

            <small>{dataBR(item.data_atividade)}</small>
            <div className="actions">{linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade) && <a className="btn-whatsapp" href={linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade)} target="_blank" rel="noreferrer">WhatsApp</a>}<button type="button" className="btn-editar" onClick={() => editarAtendimento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirAtendimento(item.id)}>Excluir</button></div>
          </div>
        ))}

        {!atividades.length && (
          <div className="empty">
            Nenhum atendimento registrado. Os botões Editar e Excluir aparecerão em cada atendimento cadastrado.
          </div>
        )}
      </section>
    </>
  )
}
  function Agenda() {
    const [mostrarFormTarefa, setMostrarFormTarefa] = useState(() => !!sessionStorage.getItem('centraltruck_agendar_empresa') || !!localStorage.getItem('ct_rascunho_agenda'))
    const [salvandoTarefa, setSalvandoTarefa] = useState(false)
    const [mensagemTarefa, setMensagemTarefa] = useState('')
    const [lembrarNoCRM, setLembrarNoCRM] = useState(true)
    const [antecedencia, setAntecedencia] = useState('0')
    const [avisosAgenda, setAvisosAgenda] = useState([])
    const numeroLembrete = '31975255079'
    useEffect(() => {
      const verificar = () => {
        const agora = Date.now()
        const avisos = tarefas.filter(t => {
          if (t.status === 'Concluída' || !t.data_hora || localStorage.getItem('ct_lembrete_' + t.id) === 'nao') return false
          const prazo = new Date(t.data_hora).getTime() - Number(localStorage.getItem('ct_antecedencia_' + t.id) || 0) * 60000
          return prazo <= agora && agora - prazo < 86400000
        })
        setAvisosAgenda(avisos)
        avisos.forEach(t => {
          const chave = 'ct_aviso_exibido_' + t.id + '_' + t.data_hora
          if (!sessionStorage.getItem(chave) && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Central Truck — Lembrete', {body: t.titulo + ' • ' + (nomeEmpresa(t.empresa_id) || 'Contato')})
            sessionStorage.setItem(chave, 'sim')
          }
        })
      }
      verificar()
      const intervalo = setInterval(verificar, 60000)
      return () => clearInterval(intervalo)
    }, [tarefas])
    const whatsappParaMim = tarefa => {
      const telefone = numeroLembrete.replace(/\D/g, '')
      const destino = telefone.startsWith('55') ? telefone : '55' + telefone
      const mensagem = 'LEMBRETE CENTRAL TRUCK%0A' + encodeURIComponent('Cliente: ' + nomeEmpresa(tarefa.empresa_id) + '\nTarefa: ' + tarefa.titulo + '\nData: ' + dataBR(tarefa.data_hora) + '\n' + (tarefa.descricao || ''))
      return 'https://wa.me/' + destino + '?text=' + mensagem
    }

    const [tarefaEditandoId, setTarefaEditandoId] = useState(null)
    const [formTarefa, setFormTarefa] = useState(() => {
       try { const salvo = JSON.parse(localStorage.getItem('ct_rascunho_agenda') || 'null'); if (salvo && typeof salvo === 'object') return salvo } catch (_) {}
       return { empresa_id: '', cliente_avulso: '', titulo: '', descricao: '', data_hora: '', prioridade: 'Normal', status: 'Pendente' }
     })
     useEffect(() => {
       if (mostrarFormTarefa) localStorage.setItem('ct_rascunho_agenda', JSON.stringify(formTarefa))
     }, [formTarefa, mostrarFormTarefa])

    useEffect(() => {
      const id = sessionStorage.getItem('centraltruck_agendar_empresa')
      if (id) {
        setFormTarefa(anterior => ({ ...anterior, empresa_id: id, titulo: 'Retornar contato', status: 'Pendente' }))
        setMostrarFormTarefa(true)
        sessionStorage.removeItem('centraltruck_agendar_empresa')
      }
    }, [])

    function editarTarefa(item) {
      setFormTarefa({
        empresa_id: item.empresa_id || '',
        cliente_avulso: (item.descricao || '').match(/^Cliente não cadastrado: (.*?)(?:\n|$)/)?.[1] || '',
        titulo: item.titulo || '',
        descricao: (item.descricao || '').replace(/^Cliente não cadastrado: .*?(?:\n|$)/, ''),
        data_hora: item.data_hora ? String(item.data_hora).slice(0,16) : '',
        prioridade: item.prioridade || 'Normal',
        status: item.status || 'Pendente'
      })
      setTarefaEditandoId(item.id)
      setLembrarNoCRM(localStorage.getItem('ct_lembrete_' + item.id) !== 'nao')
      setAntecedencia(localStorage.getItem('ct_antecedencia_' + item.id) || '0')
      setMostrarFormTarefa(true)
    }

    async function excluirTarefa(id) {
      const confirmar = window.confirm('Tem certeza que deseja excluir esta tarefa?')
      if (!confirmar) return

      const { error } = await supabase.from('tarefas').delete().eq('id', id)
      if (error) {
        alert('Erro ao excluir tarefa: ' + error.message)
        return
      }
      await carregarDados()
    }

    async function salvarTarefa(e) {
      e.preventDefault()

      if (!formTarefa.titulo.trim() || !formTarefa.data_hora) {
        alert('Informe o título e a data/hora da tarefa.')
        return
      }

      setSalvandoTarefa(true)
      setMensagemTarefa('')

      const dadosTarefa = {
        empresa_id: formTarefa.empresa_id ? Number(formTarefa.empresa_id) : null,
        titulo: formTarefa.titulo.trim(),
        descricao: [!formTarefa.empresa_id && formTarefa.cliente_avulso.trim() ? 'Cliente não cadastrado: ' + formTarefa.cliente_avulso.trim() : '', formTarefa.descricao.trim()].filter(Boolean).join('\n') || null,
        data_hora: formTarefa.data_hora,
        prioridade: formTarefa.prioridade,
        status: formTarefa.status,
      }
      const consultaTarefa = tarefaEditandoId
        ? supabase.from('tarefas').update(dadosTarefa).eq('id', tarefaEditandoId)
        : supabase.from('tarefas').insert([dadosTarefa])
      const { error } = await consultaTarefa

      if (error) {
        alert('Erro ao salvar tarefa: ' + error.message)
        setSalvandoTarefa(false)
        return
      }

      const idSalvo = tarefaEditandoId
      if (idSalvo) { localStorage.setItem('ct_lembrete_' + idSalvo, lembrarNoCRM ? 'sim' : 'nao'); localStorage.setItem('ct_antecedencia_' + idSalvo, antecedencia) }
      localStorage.removeItem('ct_rascunho_agenda')
       setMensagemTarefa(tarefaEditandoId ? 'Tarefa atualizada com sucesso!' : 'Tarefa cadastrada com sucesso!')
      setTarefaEditandoId(null)
      setMostrarFormTarefa(false)
      setSalvandoTarefa(false)
      setFormTarefa({
        empresa_id: '',
        titulo: '',
        descricao: '',
        data_hora: '',
        prioridade: 'Normal',
        status: 'Pendente',
      })
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Agenda</h1>
            <p>Retornos, ligações, visitas e tarefas comerciais. {tarefas.length} tarefa(s) sincronizada(s) com o Dashboard.</p>
          </div>
        </div>

        <button type="button" className="btn-secondary" onClick={carregarDados} style={{marginRight:12}}>↻ Atualizar agendamentos</button>
        {erro && <p role="alert">Erro ao carregar agenda: {erro}</p>}
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setTarefaEditandoId(null); setFormTarefa({ empresa_id:'', cliente_avulso:'', titulo:'', descricao:'', data_hora:'', prioridade:'Normal', status:'Pendente' }); setMostrarFormTarefa(true) }}
        >
          + Nova Tarefa
        </button>

        {mostrarFormTarefa && (
          <section className="panel form-panel">
            <form onSubmit={salvarTarefa}>
              <div className="form-grid">
                <label>
                  Empresa
                  <select
                    value={formTarefa.empresa_id}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, empresa_id: e.target.value })
                    }
                  >
                    <option value="">Sem empresa vinculada</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome_fantasia || empresa.nome}
                      </option>
                    ))}
                  </select>
                </label>

                {!formTarefa.empresa_id && (
                  <label>
                    Nome do cliente não cadastrado
                    <input
                      type="text"
                      value={formTarefa.cliente_avulso || ''}
                      onChange={(e) => setFormTarefa({ ...formTarefa, cliente_avulso: e.target.value })}
                      placeholder="Digite o nome do cliente ou empresa"
                    />
                  </label>
                )}

                <label>
                  Título
                  <input
                    type="text"
                    value={formTarefa.titulo}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, titulo: e.target.value })
                    }
                    placeholder="Ex.: Retornar para cliente"
                    required
                  />
                </label>

                <label>
                  Data e hora
                  <input
                    type="datetime-local"
                    value={formTarefa.data_hora}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, data_hora: e.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Prioridade
                  <select
                    value={formTarefa.prioridade}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, prioridade: e.target.value })
                    }
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={formTarefa.status}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, status: e.target.value })
                    }
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </label>

                <label className="full">
                  Descrição
                  <textarea
                    value={formTarefa.descricao}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, descricao: e.target.value })
                    }
                    placeholder="Observações sobre a tarefa..."
                  />
                </label>
              </div>

              <div style={{margin:'12px 0',display:'flex',gap:'14px',flexWrap:'wrap',alignItems:'center'}}><label><input type="checkbox" checked={lembrarNoCRM} onChange={e=>setLembrarNoCRM(e.target.checked)} /> Lembrar no CRM</label><label>Antecedência <select value={antecedencia} onChange={e=>setAntecedencia(e.target.value)}><option value="0">Na hora</option><option value="15">15 minutos</option><option value="60">1 hora</option><option value="1440">1 dia</option></select></label><button type="button" onClick={() => { if ('Notification' in window) Notification.requestPermission(); else alert('Seu navegador não suporta notificações.'); }}>Ativar notificações do navegador</button></div><p style={{fontSize:'12px'}}>Avisos automáticos funcionam enquanto o CRM estiver aberto. O envio pelo WhatsApp exige clicar em enviar.</p>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={salvandoTarefa}>
                  {salvandoTarefa ? 'Salvando...' : 'Salvar Tarefa'}
                </button>
                <button type="button" onClick={() => setMostrarFormTarefa(false)}>
                  Cancelar
                </button>
              </div>

              {mensagemTarefa && <p>{mensagemTarefa}</p>}
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-heading"><div><h2>Agendamentos cadastrados ({tarefas.length})</h2><p>Todos os contatos salvos na Agenda.</p></div></div>
          {tarefas.map((tarefa) => (
            <div className="activity" key={tarefa.id}>
              <div className="activity-icon">✓</div>
              <div>
                <b>{tarefa.titulo}</b>
                <span>{nomeEmpresa(tarefa.empresa_id)}</span>
                <p>{tarefa.descricao || 'Sem descrição.'}</p>
              </div>
              <div className="task-date">
                <b>{dataBR(tarefa.data_hora)}</b>
                <span>{tarefa.status}</span>
                <div className="actions">
                  <a className="btn-whatsapp" href={whatsappParaMim(tarefa)} target="_blank" rel="noreferrer">🔔 Lembrete no meu WhatsApp</a>
                  <button type="button" className="btn-editar" onClick={() => editarTarefa(tarefa)}>Editar</button>
                  <button type="button" className="btn-excluir" onClick={() => excluirTarefa(tarefa.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
          {!tarefas.length && (
            <div className="empty">Nenhuma tarefa cadastrada.</div>
          )}
        </section>
      </>
    )
  }

  function Orcamentos() {
    const chaveRascunho = 'centraltruck_orcamento_rascunho_' + (session?.user?.id || 'local')
    const [mostrarForm, setMostrarForm] = useState(() => {
      try { return Boolean(JSON.parse(localStorage.getItem(chaveRascunho))?.aberto) } catch { return false }
    })
    const [salvando, setSalvando] = useState(false)
    const [filtroMes, setFiltroMes] = useState('')
    const [filtroInicio, setFiltroInicio] = useState('')
    const [filtroFim, setFiltroFim] = useState('')
    const orcamentosFiltrados = orcamentos.filter(item => {
      if (!item.data_envio) return !filtroMes && !filtroInicio && !filtroFim
      const data = String(item.data_envio).slice(0,10)
      if (filtroMes && data.slice(0,7) !== filtroMes) return false
      if (filtroInicio && data < filtroInicio) return false
      if (filtroFim && data > filtroFim) return false
      return true
    })
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(() => {
      try { return JSON.parse(localStorage.getItem(chaveRascunho))?.editandoId ?? null } catch { return null }
    })
    const [osAberta, setOsAberta] = useState(null)
    const [osArquivos, setOsArquivos] = useState([])
    const [osErro, setOsErro] = useState('')
    const [osEnviando, setOsEnviando] = useState(false)
    async function carregarOS(item) {
      setOsAberta(item)
      setOsErro('')
      const {data,error} = await supabase.storage.from('orcamento-anexos').list(String(item.id))
      if(error){setOsErro('Armazenamento indisponível: '+error.message);setOsArquivos([]);return}
      setOsArquivos((data||[]).filter(x=>x.name!=='.emptyFolderPlaceholder'))
    }
    async function anexarOS(e) {
      const arquivo=e.target.files?.[0]
      e.target.value=''
      if(!arquivo||!osAberta)return
      if(arquivo.size>10485760){setOsErro('Limite de 10 MB por arquivo.');return}
      if(!/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(arquivo.name)){setOsErro('Selecione PDF, Word ou imagem.');return}
      setOsEnviando(true)
      setOsErro('')
      try {
        const nome=Date.now()+'-'+arquivo.name.replace(/[^a-zA-Z0-9._-]/g,'_')
        const {error}=await supabase.storage.from('orcamento-anexos').upload(String(osAberta.id)+'/'+nome,arquivo)
        if(error)throw error
        await carregarOS(osAberta)
      }catch(error){setOsErro('Erro ao salvar OS: '+error.message)}
      finally{setOsEnviando(false)}
    }
    async function visualizarOS(nome) {
      const {data,error}=await supabase.storage.from('orcamento-anexos').createSignedUrl(String(osAberta.id)+'/'+nome,120)
      if(error){setOsErro(error.message);return}
      window.open(data.signedUrl,'_blank','noopener,noreferrer')
    }
    const [form, setForm] = useState(() => {
      let anterior = null
      try { anterior = JSON.parse(localStorage.getItem(chaveRascunho))?.form } catch {}
      return anterior || {
      empresa_id: '',
      oportunidade_id: '',
      numero_orcamento: '',
      descricao: '',
      valor: '',
      status: 'Enviado',
      data_envio: new Date().toISOString().slice(0, 10),
      validade: '',
      observacoes: '',
      }
    })
    useEffect(() => {
      if (mostrarForm) localStorage.setItem(chaveRascunho, JSON.stringify({aberto:true,editandoId:orcamentoEditandoId,form}))
    }, [mostrarForm, orcamentoEditandoId, form, chaveRascunho])

    async function salvarOrcamento(e) {
      e.preventDefault()
      if (!form.empresa_id || !form.descricao) {
        alert('Selecione a empresa e informe a descrição.')
        return
      }
      setSalvando(true)
      const dadosOrcamento = {
        empresa_id: Number(form.empresa_id),
        oportunidade_id: form.oportunidade_id ? Number(form.oportunidade_id) : null,
        numero_orcamento: form.numero_orcamento.trim() || null,
        descricao: form.descricao.trim(),
        valor: form.valor ? Number(form.valor) : null,
        status: form.status,
        data_envio: form.data_envio || null,
        validade: form.validade || null,
        observacoes: form.observacoes.trim() || null,
      }
      const consultaOrcamento = orcamentoEditandoId
        ? supabase.from('orcamentos').update(dadosOrcamento).eq('id', orcamentoEditandoId)
        : supabase.from('orcamentos').insert([dadosOrcamento])
      const { error } = await consultaOrcamento
      if (error) {
        alert('Erro ao salvar orçamento: ' + error.message)
        setSalvando(false)
        return
      }
      setForm({
        empresa_id: '', oportunidade_id: '', numero_orcamento: '', descricao: '',
        valor: '', status: 'Enviado', data_envio: new Date().toISOString().slice(0, 10),
        validade: '', observacoes: '',
      })
      localStorage.removeItem(chaveRascunho)
      setOrcamentoEditandoId(null)
      setMostrarForm(false)
      setSalvando(false)
      await carregarDados()
    }

    function editarOrcamento(item) {
      setForm({
        empresa_id: item.empresa_id || '',
        oportunidade_id: item.oportunidade_id || '',
        numero_orcamento: item.numero_orcamento || '',
        descricao: item.descricao || '',
        valor: item.valor ?? '',
        status: item.status || 'Enviado',
        data_envio: item.data_envio ? String(item.data_envio).slice(0,10) : '',
        validade: item.validade ? String(item.validade).slice(0,10) : '',
        observacoes: item.observacoes || ''
      })
      setOrcamentoEditandoId(item.id)
      setMostrarForm(true)
    }

    async function excluirOrcamento(id) {
      if (!window.confirm('Excluir este orçamento?')) return
      const { error } = await supabase.from('orcamentos').delete().eq('id', id)
      if (error) return alert('Erro ao excluir orçamento: ' + error.message)
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Orçamentos</h1>
            <p>Controle dos orçamentos enviados aos clientes.</p>
          </div>
          <button className="primary" onClick={() => {
            if (mostrarForm) { localStorage.removeItem(chaveRascunho); setMostrarForm(false); setOrcamentoEditandoId(null); return }
            setOrcamentoEditandoId(null)
            setForm({ empresa_id:'', oportunidade_id:'', numero_orcamento:'', descricao:'', valor:'', status:'Enviado', data_envio:new Date().toISOString().slice(0,10), validade:'', observacoes:'' })
            setMostrarForm(true)
          }}>
            {mostrarForm ? 'Cancelar' : '+ Novo Orçamento'}
          </button>
        </div>

        {mostrarForm && (
          <section className="panel">
            <h2>{orcamentoEditandoId ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
            <form onSubmit={salvarOrcamento}>
              <div className="form-grid">
                <label>Empresa *
                  <select value={form.empresa_id} onChange={(e) => setForm({...form, empresa_id:e.target.value})} required>
                    <option value="">Selecione</option>
                    {empresas.map((x)=><option key={x.id} value={x.id}>{x.nome_fantasia || x.nome}</option>)}
                  </select>
                </label>
                <label>Oportunidade
                  <select value={form.oportunidade_id} onChange={(e) => setForm({...form, oportunidade_id:e.target.value})}>
                    <option value="">Sem vínculo</option>
                    {oportunidades.filter((x)=>!form.empresa_id || String(x.empresa_id)===String(form.empresa_id)).map((x)=><option key={x.id} value={x.id}>{x.titulo}</option>)}
                  </select>
                </label>
                <label>Número
                  <input value={form.numero_orcamento} onChange={(e)=>setForm({...form,numero_orcamento:e.target.value})} placeholder="Ex.: ORC-001"/>
                </label>
                <label>Valor (R$)
                  <input type="number" min="0" step="0.01" value={form.valor} onChange={(e)=>setForm({...form,valor:e.target.value})}/>
                </label>
                <label>Status
                  <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                    {['Rascunho','Enviado','Visualizado','Em negociação','Aprovado','Recusado','Finalizado'].map((x)=><option key={x}>{x}</option>)}
                  </select>
                </label>
                <label>Data de envio
                  <input type="date" value={form.data_envio} onChange={(e)=>setForm({...form,data_envio:e.target.value})}/>
                </label>
                <label>Validade
                  <input type="date" value={form.validade} onChange={(e)=>setForm({...form,validade:e.target.value})}/>
                </label>
                <label className="full">Descrição *
                  <textarea value={form.descricao} onChange={(e)=>setForm({...form,descricao:e.target.value})} required/>
                </label>
                <label className="full">Observações
                  <textarea value={form.observacoes} onChange={(e)=>setForm({...form,observacoes:e.target.value})}/>
                </label>
              </div>
              <div className="form-actions">
                <button className="primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar Orçamento'}</button>
              </div>
            </form>
          </section>
        )}

        {osAberta && <section className="panel">
          <h2>Anexar OS — Orçamento {osAberta.numero_orcamento || osAberta.id}</h2>
          <p>Selecione PDF, Word ou imagem (máximo 10 MB).</p>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={osEnviando} onChange={anexarOS}/>
          {osEnviando && <p>Enviando...</p>}
          {osErro && <p role="alert" style={{color:'#ff8585'}}>{osErro}</p>}
          {osArquivos.map(a=><div key={a.name} style={{marginTop:10}}>
            <span>{a.name} </span>
            <button type="button" onClick={()=>visualizarOS(a.name)}>Abrir / baixar</button>
          </div>)}
          <button type="button" onClick={()=>setOsAberta(null)}>Fechar</button>
        </section>}
        <section className="panel" style={{marginBottom:16}}>
          <h2>Filtrar orçamentos por mês e data</h2>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}>
            <label>Mês <input type="month" value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/></label>
            <label>Data inicial <input type="date" value={filtroInicio} onChange={e=>setFiltroInicio(e.target.value)}/></label>
            <label>Data final <input type="date" value={filtroFim} onChange={e=>setFiltroFim(e.target.value)}/></label>
            <button type="button" onClick={()=>{setFiltroMes('');setFiltroInicio('');setFiltroFim('')}}>Limpar filtros</button>
          </div>
          <p>{orcamentosFiltrados.length} orçamento(s) encontrado(s)</p>
        </section>
        <section className="panel table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Empresa</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Envio</th><th>Ações</th></tr></thead>
            <tbody>
              {orcamentosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.numero_orcamento || `#${item.id}`}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.descricao || '—'}</td>
                  <td>{dinheiro(item.valor)}</td>
                  <td><span className="status">{item.status}</span></td>
                  <td>{dataBR(item.data_envio)}</td>
                  <td><div className="actions"><button type="button" onClick={() => carregarOS(item)}>Anexar OS</button><button type="button" className="btn-editar" onClick={() => editarOrcamento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={()=>excluirOrcamento(item.id)}>Excluir</button></div></td>
                </tr>
              ))}
              {!orcamentos.length && <tr><td colSpan="7" className="empty">Nenhum orçamento cadastrado.</td></tr>}
            </tbody>
          </table>
        </section>
      </>
    )
  }

  function Relatorios() {
    const [arquivoLeads, setArquivoLeads] = useState(null)
    const [importandoLeads, setImportandoLeads] = useState(false)
    const [msgImportacao, setMsgImportacao] = useState('')

    async function baixarModeloLeads() {
      const XLSX = await import('xlsx')
      const dados = [
        ['CENTRAL TRUCK SERVICE'],
        ['LISTA DE LEADS - IMPORTACAO PARA O CRM'],
        [],
        ['Nome da empresa','Nome fantasia','CNPJ','Segmento','Classificacao','Status','Cidade','Estado','Telefone','WhatsApp','E-mail','Site','Observacoes'],
        ['Transportadora Exemplo','Exemplo Logistica','','Transportadora','A','Lead novo','Contagem','MG','31999999999','31999999999','contato@exemplo.com.br','','Cliente para prospeccao']
      ]
      const ws = XLSX.utils.aoa_to_sheet(dados)
      ws['!merges'] = [XLSX.utils.decode_range('A1:M1'), XLSX.utils.decode_range('A2:M2')]
      ws['!cols'] = [{wch:28},{wch:26},{wch:20},{wch:20},{wch:15},{wch:20},{wch:20},{wch:10},{wch:18},{wch:18},{wch:30},{wch:28},{wch:38}]
      ws['!rows'] = [{hpt:34},{hpt:25},{hpt:8},{hpt:28}]
      ws['!autofilter'] = { ref: 'A4:M5' }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Leads Central Truck')
      XLSX.writeFile(wb, 'Modelo_Leads_Central_Truck.xlsx')
    }

    function separarCSV(linha) {
      const valores = []
      let atual = ''
      let aspas = false
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i]
        if (ch === '"') {
          if (aspas && linha[i + 1] === '"') { atual += '"'; i++ } else aspas = !aspas
        } else if ((ch === ',' || ch === ';') && !aspas) {
          valores.push(atual.trim()); atual = ''
        } else atual += ch
      }
      valores.push(atual.trim())
      return valores
    }

    async function importarLeads() {
      if (!arquivoLeads) { setMsgImportacao('Selecione um arquivo para continuar.'); return }
      const extensao = (arquivoLeads.name.split('.').pop() || '').toLowerCase()
      if (extensao !== 'csv') {
        setMsgImportacao('Arquivo recebido sem alterar o original. PDF, JPG/PNG e Word podem ser enviados e mantidos no formato original; para cadastrar clientes automaticamente no Funil, use CSV.')
        return
      }
      setImportandoLeads(true)
      setMsgImportacao('')
      try {
        const texto = await arquivoLeads.text()
        const linhas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim())
        if (linhas.length < 2) throw new Error('O arquivo está vazio ou sem clientes.')
        const colunas = separarCSV(linhas[0]).map((x) => x.toLowerCase().trim())
        const obrigatoria = colunas.indexOf('nome')
        if (obrigatoria < 0) throw new Error('A coluna "nome" é obrigatória. Use o modelo disponível.')
        let importados = 0
        let falhas = 0
        for (const linha of linhas.slice(1)) {
          const valores = separarCSV(linha)
          const registro = {}
          colunas.forEach((col, idx) => { registro[col] = (valores[idx] || '').trim() })
          if (!registro.nome) { falhas++; continue }
          const status = registro.status || 'Lead novo'
          const empresa = {
            nome: registro.nome,
            nome_fantasia: registro.nome_fantasia || null,
            cnpj: registro.cnpj || null,
            segmento: registro.segmento || null,
            classificacao: ['A','B','C'].includes((registro.classificacao || '').toUpperCase()) ? registro.classificacao.toUpperCase() : 'B',
            status,
            cidade: registro.cidade || null,
            estado: registro.estado || 'MG',
            telefone: registro.telefone || null,
            whatsapp: registro.whatsapp || null,
            email: registro.email || null,
            site: registro.site || null,
            observacoes: registro.observacoes || null
          }
          const { data: criada, error: erroEmpresa } = await supabase.from('empresas').insert([empresa]).select('id').single()
          if (erroEmpresa || !criada?.id) { falhas++; continue }
          importados++
        }
        await carregarDados()
        setArquivoLeads(null)
        setMsgImportacao(importados + ' cliente(s) importado(s) para Empresas/Leads. Oportunidades só serão criadas quando cadastradas explicitamente.' + (falhas ? ' ' + falhas + ' linha(s) com erro.' : ''))
      } catch (e) {
        setMsgImportacao('Erro na importação: ' + e.message)
      } finally {
        setImportandoLeads(false)
      }
    }

    return (
      <>
        <div className="page-title"><div><h1>Relatórios</h1><p>Indicadores comerciais da Central Truck.</p></div></div>
        <section className="cards">
          <Card titulo="Leads" valor={empresas.length} />
          <Card titulo="Contatos" valor={contatos.length} />
          <Card titulo="Oportunidades" valor={oportunidades.length} />
          <Card titulo="Vendas" valor={vendas.length} />
          <Card titulo="Conversão" valor={`${conversao}%`} />
          <Card titulo="Valor Vendido" valor={dinheiro(valorVendido)} />
        </section>
        <section className="panel lead-import-panel">
          <div className="panel-heading">
            <div><h2>Enviar relatórios e importar clientes</h2><p>Selecione PDF, JPG, PNG, Word ou CSV. O arquivo original é mantido sem alteração; listas em CSV podem ser organizadas automaticamente em Empresas/Leads e no Funil Comercial.</p></div>
          </div>
          <div className="lead-import-actions">
            <button type="button" className="btn-secondary" onClick={baixarModeloLeads}>Baixar modelo Excel</button>
            <label className="file-import-box">
              <span>{arquivoLeads ? arquivoLeads.name : 'Selecionar lista de clientes (.CSV)'}</span>
              <input type="file" accept=".csv,text/csv" onChange={(e)=>{setArquivoLeads(e.target.files?.[0] || null);setMsgImportacao('')}} />
            </label>
            <button type="button" className="primary" disabled={importandoLeads || !arquivoLeads} onClick={importarLeads}>{importandoLeads ? 'Importando...' : 'Importar clientes para o Funil'}</button>
          </div>
          <p className="import-help"><b>Importação de clientes:</b> use CSV para cadastrar automaticamente Empresas/Leads e criar as oportunidades no Funil. Colunas aceitas: nome, nome_fantasia, CNPJ, segmento, classificação A/B/C, status, cidade, estado, telefone, WhatsApp, e-mail, site e observações.</p>
          <div className="import-message"><b>Relatórios PDF, JPG, PNG e Word:</b> são documentos para consulta e não são convertidos automaticamente em clientes, evitando perda de formatação ou cadastro incorreto. Para importar uma lista desses formatos, converta-a primeiro para CSV usando o modelo acima.</div>
          {msgImportacao && <div className="import-message">{msgImportacao}</div>}
        </section>
      </>
    )
  }


  function ImportarContatos() {
    const [arquivo, setArquivo] = useState(null)
    const [importando, setImportando] = useState(false)
    const [mensagem, setMensagem] = useState('')

    const normalizar = (v='') => String(v ?? '').trim()
    const chave = (v='') => normalizar(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')

    function valorCampo(registro, nomes) {
      for (const nome of nomes) {
        const k = Object.keys(registro).find(x => chave(x) === chave(nome))
        if (k && normalizar(registro[k])) return normalizar(registro[k])
      }
      return ''
    }

    async function lerArquivo(file) {
      const ext=(file.name.split('.').pop()||'').toLowerCase()
      if (['xlsx','xls','xlsm','xlsb','ods','csv','txt'].includes(ext)) {
        const XLSX=await import('xlsx')
        const buffer=await file.arrayBuffer()
        const wb=XLSX.read(buffer,{type:'array'})
        const aliases=['empresa','nome da empresa','razao social','nome fantasia','nome','cliente','oficina','estabelecimento','organizacao','company','organization','contato','nome do contato','telefone','celular','whatsapp','email','e-mail','endereco','cidade','cnpj','responsavel']
        const saida=[]
        for(const nomeAba of wb.SheetNames){
          const matriz=XLSX.utils.sheet_to_json(wb.Sheets[nomeAba],{header:1,defval:'',raw:false,blankrows:false})
          if(!matriz.length) continue
          const pontuacao=linha=>(Array.isArray(linha)?linha:[]).filter(c=>aliases.some(a=>chave(c)===chave(a)||chave(c).startsWith(chave(a))&&chave(a).length>4)).length
          const candidatos=matriz.slice(0,30).map((linha,i)=>({i,p:pontuacao(linha)})).sort((a,b)=>b.p-a.p)
          const indice=candidatos[0]?.p>=2?candidatos[0].i:-1
          if(indice<0) continue
          const titulos=matriz[indice].map((c,i)=>normalizar(c)||'Coluna '+(i+1))
          const registros=matriz.slice(indice+1).filter(linha=>Array.isArray(linha)&&linha.some(c=>normalizar(c))).map(linha=>Object.fromEntries(titulos.map((titulo,i)=>[titulo,linha[i]??''])))
          saida.push(...registros)
        }
        if(!saida.length) throw new Error('Não identifiquei automaticamente os campos desta planilha. Envie uma planilha com títulos como Nome, Empresa, Telefone ou E-mail.')
        return saida
      }
      if (['json'].includes(ext)) {
        const obj=JSON.parse(await file.text())
        return Array.isArray(obj)?obj:(obj.contatos||obj.clientes||obj.empresas||[])
      }
      if (['vcf','vcard'].includes(ext)) {
        const texto=await file.text()
        return texto.split(/BEGIN:VCARD/i).slice(1).map(bloco=>{
          const pega=(re)=>((bloco.match(re)||[])[1]||'').trim()
          return {nome:pega(/\nFN[^:]*:([^\r\n]+)/i),telefone:pega(/\nTEL[^:]*:([^\r\n]+)/i),email:pega(/\nEMAIL[^:]*:([^\r\n]+)/i),empresa:pega(/\nORG[^:]*:([^\r\n]+)/i)}
        })
      }
      throw new Error('Formato não compatível para importação automática.')
    }

    async function importar() {
      if(!arquivo){setMensagem('Selecione um arquivo.');return}
      setImportando(true); setMensagem('')
      try{
        const linhas=await lerArquivo(arquivo)
        if(!linhas.length) throw new Error('Nenhum contato encontrado no arquivo.')
        let ok=0, erros=0
        for(const r of linhas){
          const nomeEmpresa=valorCampo(r,['nome da empresa','empresa','razao social','razão social','nome fantasia','cliente','oficina','estabelecimento','organização','nome','company','organization','org','nome do contato','contato'])
          const contato=valorCampo(r,['pessoa de contato','contato','responsavel','responsável','nome do contato','nome decisor / contato','contact','contact name'])
          const camposTelefone = Object.keys(r).filter(k => /^(telefone|fone|tel|celular|whatsapp|whats|zap|phone|mobile|contatotelefonico|numero)/.test(chave(k)))
          const telefone=valorCampo(r,['telefone','telefone comercial','fone','phone','celular','mobile','telefone 1','telefone principal','telefone 2','telefone de contato','contato telefonico','fone/whatsapp','telefone/whatsapp','tel','numero de telefone']) || camposTelefone.map(k => normalizar(r[k])).find(Boolean) || ''
          const whatsapp=valorCampo(r,['whatsapp','telefone direto / whatsapp','telefone direto whatsapp','whats app','zap','celular whatsapp','telefone whatsapp']) || telefone
          const email=valorCampo(r,['email','e-mail','e-mail corporativo / público','email corporativo publico','mail','correio eletronico'])
          const cidade=valorCampo(r,['cidade','city'])
          const estado=valorCampo(r,['estado','uf','state']) || 'MG'
          const segmento=valorCampo(r,['segmento','categoria','ramo'])
          const status=valorCampo(r,['status','etapa']) || 'Lead novo'
          const cnpj=valorCampo(r,['cnpj','cpf/cnpj','documento'])
          const observacoes=[valorCampo(r,['observacoes','observações','obs','notes']),...['Cargo / área decisora','Frota / operação','Tecnologias / equipamentos','Prioridade','LinkedIn decisor','Funcionários estimados'].map(c=>valorCampo(r,[c])?c+': '+valorCampo(r,[c]):'')].filter(Boolean).join(' | ')
          if(!nomeEmpresa){erros++;continue}
          const dados={nome:nomeEmpresa,nome_fantasia:null,cnpj:cnpj||null,segmento:segmento||null,status,cidade:cidade||null,estado,telefone:telefone||null,whatsapp:whatsapp||null,email:email||null,observacoes:[contato?'Contato: '+contato:'',observacoes].filter(Boolean).join(' | ')||null}
          const {error}=await supabase.from('empresas').insert([dados])
          if(error) { erros++; console.error('Falha ao importar empresa:',nomeEmpresa,error); }
          else ok++
        }
        await carregarDados()
        if(ok>0) {
          setPagina('empresas')
          window.alert(ok+' empresa(s) salva(s) em Empresas / Leads.'+(erros?' '+erros+' registro(s) falharam; confira o console para detalhes.':''))
        } else {
          setMensagem('Nenhuma empresa foi salva. '+erros+' registro(s) falharam. Confira os nomes das empresas e as permissões de gravação no Supabase.')
        }
      }catch(e){setMensagem('Erro: '+e.message)}
      finally{setImportando(false)}
    }

    return <>
      <div className="page-title"><div><h1>Importar Contatos</h1><p>Importe listas de contatos e clientes diretamente para o CRM.</p></div></div>
      <section className="panel lead-import-panel">
        <h2>Selecionar arquivo</h2>
        <p>Compatível com planilhas Excel antigas e atuais, CSV, ODS, TXT, JSON e contatos VCF/vCard.</p>
        <div className="lead-import-actions">
          <label className="file-import-box">
            <span>{arquivo?arquivo.name:'Selecionar arquivo de contatos'}</span>
            <input type="file" accept=".xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.txt,.json,.vcf,.vcard" onChange={e=>{setArquivo(e.target.files?.[0]||null);setMensagem('')}} />
          </label>
          <button type="button" className="primary" disabled={!arquivo||importando} onClick={importar}>{importando?'Importando...':'Importar para o CRM'}</button>
        </div>
        <p className="import-help"><b>Campos reconhecidos automaticamente:</b> empresa, pessoa de contato, CNPJ, segmento, status, cidade, estado, telefone, WhatsApp, e-mail e observações. Os títulos podem variar, por exemplo: Empresa, Razão Social, Contato, Responsável, Fone, Celular, UF ou E-mail.</p>
        <div className="import-message"><b>PDF, JPG/PNG e Word:</b> podem ser mantidos em Relatórios, mas não são convertidos automaticamente em contatos para evitar cadastros incorretos.</div>
        {mensagem&&<div className="import-message">{mensagem}</div>}
      </section>
    </>
  }

  function Configuracoes() {
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Configurações</h1>
            <p>Informações gerais do CRM.</p>
          </div>
        </div>

        <section className="panel config">
          <h2>Central Truck Service</h2>
          <p><b>Sistema:</b> Central Truck CRM</p>
          <p><b>Banco de dados:</b> Supabase</p>
          <p><b>Hospedagem:</b> GitHub Pages</p>
          <p><b>Moeda:</b> Real brasileiro (BRL)</p>
          <p><b>Idioma:</b> Português do Brasil</p>

          <button className="primary" onClick={carregarDados}>
            Testar conexão com banco
          </button>
        </section>
      </>
    )
  }


  function OrdensServico() {
    const vazio = {numero_os:'',empresa_id:'',servicos:'',pecas:'',produto:'',valor_produto:'',valor:'',forma_pagamento:''}
    const [registros,setRegistros] = useState([])
    const [itensCatalogo,setItensCatalogo] = useState([])
    const [itemSelecionado,setItemSelecionado] = useState('')
    const [quantidadeSelecionada,setQuantidadeSelecionada] = useState('1')
    const [busca,setBusca] = useState(() => localStorage.getItem('centraltruck_os_busca') || '')
    const [filtroMesOS,setFiltroMesOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_mes') || '')
    const [filtroNumeroOS,setFiltroNumeroOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_numero') || '')
    const [form,setForm] = useState(() => { try { return {...vazio,...JSON.parse(localStorage.getItem('centraltruck_os_rascunho') || '{}')} } catch { return vazio } })
    const [editando,setEditando] = useState(() => localStorage.getItem('centraltruck_os_editando') || null)
    const [mensagem,setMensagem] = useState('')
    const [salvando,setSalvando] = useState(false)
    const [mostrarBusca,setMostrarBusca] = useState(false)
    const [carregandoOS,setCarregandoOS] = useState(false)
    useEffect(() => { localStorage.setItem('centraltruck_os_rascunho',JSON.stringify(form)) },[form])
    useEffect(() => { localStorage.setItem('centraltruck_os_busca',busca) },[busca])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_mes',filtroMesOS) },[filtroMesOS])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_numero',filtroNumeroOS) },[filtroNumeroOS])
    useEffect(() => { if(editando) localStorage.setItem('centraltruck_os_editando',editando); else localStorage.removeItem('centraltruck_os_editando') },[editando])
    const registrosFiltrados = registros.filter(item => (!filtroMesOS || String(item.criado_em || '').slice(0,7) === filtroMesOS) && (!filtroNumeroOS || normalizarBusca(item.numero_os).includes(normalizarBusca(filtroNumeroOS.trim()))))
    const selecionada = empresas.find(e=>String(e.id)===String(form.empresa_id))
    const resultados = empresas.filter(e=>normalizarBusca([e.nome_fantasia,e.razao_social,e.nome,e.cnpj,e.telefone,e.whatsapp].join(' ')).includes(normalizarBusca(busca))).slice(0,30)
    async function atualizarOS() {
      setCarregandoOS(true)
      const {data,error}=await supabase.from('ordens_servico').select('*').order('criado_em',{ascending:false})
      setCarregandoOS(false)
      if(error) {setMensagem('Não foi possível consultar as OS: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{atualizarOS()},[])
    useEffect(()=>{supabase.from('catalogo_itens').select('*').order('nome',{ascending:true}).then(({data,error})=>{if(!error)setItensCatalogo(data||[])})},[])
    function adicionarItemCatalogo() {
      const item=itensCatalogo.find(i=>String(i.id)===String(itemSelecionado))
      if(!item){setMensagem('Selecione um produto ou serviço cadastrado.');return}
      const qtd=Math.max(1,Math.floor(Number(quantidadeSelecionada)||1))
      const subtotal=(Number(item.preco)||0)*qtd
      const linha=qtd+' x '+item.nome+' — '+dinheiro(subtotal)
      setForm(v=>item.tipo==='Serviço'
        ?{...v,servicos:[v.servicos,linha].filter(Boolean).join('\n')}
        :{...v,pecas:[v.pecas,linha].filter(Boolean).join('\n'),produto:v.produto||item.nome,valor_produto:(Number(String(v.valor_produto).replace(',','.'))||0)+subtotal})
      setItemSelecionado('');setQuantidadeSelecionada('1');setMensagem('Item incluído. Confira o valor total antes de salvar.')
    }
    function escolherEmpresa(e) {
      setForm(v=>({...v,empresa_id:String(e.id)}))
      setBusca(e.nome_fantasia||e.razao_social||e.nome||'')
      setMostrarBusca(false)
    }
    async function salvar(e) {
      e.preventDefault()
      if(!form.empresa_id) {setMensagem('Selecione um cliente cadastrado na busca.');return}
      setSalvando(true);setMensagem('')
      const payload={numero_os:form.numero_os.trim(),empresa_id:form.empresa_id,servicos:form.servicos,pecas:form.pecas,produto:form.produto,valor_produto:Number(String(form.valor_produto).replace(',','.'))||0,valor:Number(String(form.valor).replace(',','.'))||0,forma_pagamento:form.forma_pagamento}
      const consulta=editando
        ?supabase.from('ordens_servico').update(payload).eq('id',editando)
        :supabase.from('ordens_servico').insert([payload])
      const {error}=await consulta
      setSalvando(false)
      if(error){setMensagem('Erro ao salvar OS: '+error.message);return}
      setForm(vazio);setBusca('');setEditando(null);setMensagem('OS salva com sucesso.')
      await atualizarOS()
    }

    function imprimirPedido(item) {
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))||{}
      const esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
      const campo=(titulo,valor)=>'<div class="campo"><small>'+esc(titulo)+'</small><strong>'+esc(valor||'—')+'</strong></div>'
      const bloco=(titulo,valor)=>'<section><h3>'+esc(titulo)+'</h3><div class="descricao">'+esc(valor||'Não informado')+'</div></section>'
      const data=item.criado_em?dataBR(item.criado_em):dataBR(new Date())
      const nome=cliente.nome_fantasia||cliente.razao_social||cliente.nome||'Cliente cadastrado'
      const total=dinheiro(item.valor)
      const logo=new URL(LOGO,window.location.href).href
      const html=`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pedido de Venda - OS ${esc(item.numero_os)}</title><style>
      @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#20262c;margin:0;font-size:12px}
      header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #19b983;padding-bottom:14px;gap:18px}
      header img{max-width:160px;max-height:78px;object-fit:contain}header .empresa{text-align:right}header .empresa b{font-size:19px;color:#126b54}
      header .empresa p{margin:5px 0;color:#444}h1{font-size:21px;margin:20px 0 5px}h2{font-size:13px;margin:0 0 12px;color:#555;font-weight:normal}
      h3{font-size:13px;background:#e8ecef;padding:9px;margin:18px 0 10px;border-left:4px solid #19b983}
      .grade{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.campo{padding:8px 0;border-bottom:1px solid #ddd;min-width:0;overflow-wrap:anywhere}
      small{display:block;font-size:10px;text-transform:uppercase;color:#666;margin-bottom:4px}.campo strong{font-size:12px;font-weight:600}
      .descricao{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;padding:4px 2px}
      .valor{margin-top:20px;padding:16px;background:#edf5f1;display:flex;justify-content:space-between;font-size:18px;font-weight:bold}
      footer{margin-top:55px;display:flex;gap:40px}footer div{flex:1;text-align:center;border-top:1px solid #777;padding-top:8px;color:#555}
      .acoes{margin:18px 0;display:flex;gap:8px}.acoes button{padding:10px 16px;background:#168b69;color:white;border:0;border-radius:5px;cursor:pointer}
      @media print{.acoes{display:none}header,.valor,h3{-webkit-print-color-adjust:exact;print-color-adjust:exact}section{break-inside:avoid}}
      </style></head><body>
      <div class="acoes"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div>
      <header><img src="${esc(logo)}" alt="Logo Central Truck"><div class="empresa"><b>CENTRAL TRUCK SERVICE</b><p>Oficina especializada em linha diesel</p><p>Contagem - MG</p><p>WhatsApp: (31) 97525-5079</p></div></header>
      <h1>PEDIDO DE VENDA</h1><h2>Ordem de Serviço nº ${esc(item.numero_os)} • Emissão: ${esc(data)}</h2>
      <h3>DADOS DO CLIENTE</h3><div class="grade">
      ${campo('Cliente / Empresa',nome)}${campo('CNPJ',cliente.cnpj)}${campo('Telefone',cliente.telefone||cliente.whatsapp)}
      ${campo('E-mail',cliente.email)}${campo('Cidade / UF',[cliente.cidade,cliente.estado].filter(Boolean).join(' / '))}
      </div>
      ${bloco('SERVIÇOS',item.servicos)}${bloco('PEÇAS E QUANTIDADES',item.pecas)}
      <h3>PRODUTO</h3><div class="grade">${campo('Produto',item.produto)}${campo('Valor do produto',dinheiro(item.valor_produto))}</div>
      <h3>CONDIÇÕES COMERCIAIS</h3><div class="grade">${campo('Forma de pagamento',item.forma_pagamento)}${campo('Data do cadastro',data)}</div>
      <div class="valor"><span>VALOR INFORMADO DA OS</span><span>${esc(total)}</span></div>
      <footer><div>Responsável Central Truck</div><div>Cliente / Responsável</div></footer>
      </body></html>`
      const janela=window.open('','_blank')
      if(!janela){setMensagem('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');return}
      janela.document.open();janela.document.write(html);janela.document.close()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({numero_os:item.numero_os||'',empresa_id:String(item.empresa_id||''),servicos:item.servicos||'',pecas:item.pecas||'',produto:item.produto||'',valor_produto:String(item.valor_produto??''),valor:String(item.valor??''),forma_pagamento:item.forma_pagamento||''})
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))
      setBusca(cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'')
      setMensagem('')
    }
    return <>
      <div className="page-title"><div><h1>Ordens de Serviço</h1><p>Cadastro de OS com vínculo aos clientes existentes.</p></div></div>
      <section className="panel">
        <h2>{editando?'Editar OS':'Nova Ordem de Serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Número da OS *<input required value={form.numero_os} onChange={e=>setForm(v=>({...v,numero_os:e.target.value}))} placeholder="Ex.: 266"/></label>
            <label>Buscar cliente cadastrado *
              <input value={busca} onFocus={()=>setMostrarBusca(true)} onChange={e=>{setBusca(e.target.value);setForm(v=>({...v,empresa_id:''}));setMostrarBusca(true)}} placeholder="Digite nome, CNPJ ou telefone" autoComplete="off"/>
            </label>
          </div>
          {mostrarBusca && <div className="panel" style={{maxHeight:210,overflowY:'auto',padding:8,marginBottom:12}}>
            {resultados.map(e=><button type="button" key={e.id} onClick={()=>escolherEmpresa(e)} style={{display:'block',width:'100%',textAlign:'left',marginBottom:5,background:'#555b63',color:'#fff',border:'1px solid #707780',borderRadius:7}}>{e.nome_fantasia||e.razao_social||e.nome||'Cliente'} — {e.cnpj||e.telefone||e.whatsapp||'Cadastro existente'}</button>)}
            {!resultados.length && <p>Nenhum cliente encontrado. Cadastre em Empresas / Leads.</p>}
          </div>}
          {selecionada && <div className="panel" style={{marginBottom:14,padding:12}}>
            <strong>Cliente vinculado: {selecionada.nome_fantasia||selecionada.razao_social||selecionada.nome}</strong>
            <p>CNPJ: {selecionada.cnpj||'—'} | Telefone: {selecionada.telefone||'—'} | WhatsApp: {selecionada.whatsapp||'—'}</p>
            <p>E-mail: {selecionada.email||'—'} | Cidade: {selecionada.cidade||'—'} / {selecionada.estado||'—'}</p>
          </div>}
          <div className="panel" style={{marginBottom:14,padding:12}}>
            <h3>Adicionar produto ou serviço cadastrado</h3>
            <div className="form-grid">
              <label>Item<select value={itemSelecionado} onChange={e=>setItemSelecionado(e.target.value)}><option value="">Selecione um item</option>{itensCatalogo.map(item=><option key={item.id} value={item.id}>{item.tipo} — {item.nome} — {dinheiro(item.preco)}</option>)}</select></label>
              <label>Quantidade<input type="number" min="1" step="1" value={quantidadeSelecionada} onChange={e=>setQuantidadeSelecionada(e.target.value)}/></label>
            </div>
            <button type="button" onClick={adicionarItemCatalogo}>Adicionar à OS</button>
          </div>
          <div className="form-grid">
            <label>Serviços<textarea rows={4} value={form.servicos} onChange={e=>setForm(v=>({...v,servicos:e.target.value}))} placeholder="Descreva os serviços"/></label>
            <label>Peças<textarea rows={4} value={form.pecas} onChange={e=>setForm(v=>({...v,pecas:e.target.value}))} placeholder="Peças e quantidades"/></label>
            <label>Produto<input value={form.produto} onChange={e=>setForm(v=>({...v,produto:e.target.value}))} placeholder="Nome do produto"/></label>
            <label>Valor do produto (R$)<input type="number" min="0" step="0.01" value={form.valor_produto} onChange={e=>setForm(v=>({...v,valor_produto:e.target.value}))} placeholder="0,00"/></label>
            <label>Valor (R$)<input type="number" min="0" step="0.01" value={form.valor} onChange={e=>setForm(v=>({...v,valor:e.target.value}))}/></label>
            <label>Forma de pagamento<select value={form.forma_pagamento} onChange={e=>setForm(v=>({...v,forma_pagamento:e.target.value}))}>
              <option value="">Selecione</option><option>Pix</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Boleto</option><option>Ticklog</option><option>Faturado</option><option>Transferência bancária</option><option>Outro</option>
            </select></label>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Salvar OS'}</button>
            <button type="button" onClick={()=>{if(!form.numero_os.trim()||!form.empresa_id){setMensagem("Informe o número da OS e selecione um cliente para gerar o pedido.");return} imprimirPedido({...form,numero_os:form.numero_os.trim(),valor:Number(String(form.valor).replace(",","."))||0,valor_produto:Number(String(form.valor_produto).replace(",","."))||0})}} style={{background:"#555b63",color:"#fff",border:"1px solid #737b83",borderRadius:8,padding:"10px 16px",cursor:"pointer"}}>Imprimir / Salvar PDF</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio);setBusca('')}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>OS cadastradas <button type="button" onClick={atualizarOS}>Atualizar</button></h2>
        <div className="form-grid" style={{marginBottom:14}}>
          <label>Buscar por número da OS<input value={filtroNumeroOS} onChange={e=>setFiltroNumeroOS(e.target.value)} placeholder="Ex.: 267" /></label>
          <label>Filtrar por mês<input type="month" value={filtroMesOS} onChange={e=>setFiltroMesOS(e.target.value)} /></label>
        </div>
        {(filtroMesOS || filtroNumeroOS) && <button type="button" onClick={()=>{setFiltroMesOS('');setFiltroNumeroOS('')}} style={{marginBottom:12}}>Limpar filtros</button>}
        {carregandoOS?<p>Carregando...</p>:<table><thead><tr><th>OS</th><th>Cliente</th><th>Serviços</th><th>Peças</th><th>Produto</th><th>Valor do produto</th><th>Valor</th><th>Pagamento</th><th>Ações</th></tr></thead>
          <tbody>{registrosFiltrados.map(item=>{const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id));return <tr key={item.id}>
            <td>{item.numero_os}</td><td>{cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'Cliente cadastrado'}</td>
            <td>{item.servicos}</td><td>{item.pecas}</td><td>{item.produto||'—'}</td><td>{dinheiro(item.valor_produto)}</td><td>{dinheiro(item.valor)}</td><td>{item.forma_pagamento}</td>
            <td><button type="button" onClick={()=>editar(item)}>Editar</button> <button type="button" onClick={()=>imprimirPedido(item)}>Pedido / PDF / Imprimir</button></td>
          </tr>})}{!registrosFiltrados.length&&<tr><td colSpan={9}>Nenhuma OS encontrada para os filtros selecionados.</td></tr>}</tbody></table>}
      </section>
    </>
  }


  function Catalogo() {
    const vazio = {tipo:'Produto',nome:'',preco:'',custo:'',preco_manual:false,quantidade_caixa:'10',quantidade_estoque:'',fornecedor:''}
    const [form,setForm] = useState(vazio)
    const [registros,setRegistros] = useState([])
    const [editando,setEditando] = useState(null)
    const [busca,setBusca] = useState('')
    const [tipoFiltro,setTipoFiltro] = useState('Todos')
    const [salvando,setSalvando] = useState(false)
    const [excluindo,setExcluindo] = useState(null)
    const [carregando,setCarregando] = useState(false)
    const [mensagem,setMensagem] = useState('')
    async function carregar() {
      setCarregando(true)
      const {data,error}=await supabase.from('catalogo_itens').select('*').order('nome',{ascending:true})
      setCarregando(false)
      if(error){setMensagem('Erro ao consultar cadastro: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{carregar()},[])
    async function salvar(e) {
      e.preventDefault()
      setSalvando(true);setMensagem('')
      const payload={
        tipo:form.tipo,nome:form.nome.trim(),
        preco:Number(String(form.preco).replace(',','.'))||0,
        custo:Number(String(form.custo).replace(',','.'))||0,
        quantidade_caixa:form.tipo==='Produto'?Math.max(1,Number(form.quantidade_caixa)||1):1,
        quantidade_estoque:form.tipo==='Produto'?Math.max(0,Number(form.quantidade_estoque)||0):0,
        fornecedor:form.fornecedor.trim()
      }
      const {error}=editando
        ?await supabase.from('catalogo_itens').update(payload).eq('id',editando)
        :await supabase.from('catalogo_itens').insert([payload])
      setSalvando(false)
      if(error){setMensagem('Não foi possível salvar: '+error.message);return}
      setForm(vazio);setEditando(null);setMensagem('Cadastro salvo com sucesso.');await carregar()
    }
    async function excluir(item) {
      if(!window.confirm('Excluir definitivamente "'+item.nome+'" do cadastro de produtos e serviços?'))return
      setExcluindo(item.id);setMensagem('')
      const {error}=await supabase.from('catalogo_itens').delete().eq('id',item.id)
      setExcluindo(null)
      if(error){setMensagem('Não foi possível excluir: '+error.message);return}
      if(String(editando)===String(item.id)){setEditando(null);setForm(vazio)}
      setMensagem('Cadastro excluído com sucesso.')
      await carregar()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({tipo:item.tipo||'Produto',nome:item.nome||'',preco:String(item.preco??''),custo:String(item.custo??''),preco_manual:true,quantidade_caixa:String(item.quantidade_caixa??10),quantidade_estoque:String(item.quantidade_estoque??0),fornecedor:item.fornecedor||''})
      window.scrollTo({top:0,behavior:'smooth'})
    }
    const filtrados=registros.filter(item=>(tipoFiltro==='Todos'||item.tipo===tipoFiltro)&&normalizarBusca([item.nome,item.fornecedor].join(' ')).includes(normalizarBusca(busca)))
    return <>
      <div className="page-title"><div><h1>Cadastro de Produtos e Serviços</h1><p>Catálogo de preços, fornecedores e quantidades da Central Truck.</p></div></div>
      <section className="panel" style={{marginBottom:18}}>
        <h2>Buscar produtos e serviços</h2>
        <div className="form-grid">
          <label>Pesquisar produto, serviço ou fornecedor<input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Digite o nome do produto ou serviço"/></label>
          <label>Mostrar<select value={tipoFiltro} onChange={e=>setTipoFiltro(e.target.value)}><option>Todos</option><option>Produto</option><option>Serviço</option></select></label>
        </div>
        <p style={{marginTop:10,fontSize:13}}>{filtrados.length} cadastro(s) encontrado(s). {busca||tipoFiltro!=='Todos'?'Veja os resultados na lista abaixo.':'Pesquise para localizar um item já cadastrado.'}</p>
        {(busca||tipoFiltro!=='Todos')&&<button type="button" onClick={()=>{setBusca('');setTipoFiltro('Todos')}}>Limpar busca</button>}
      </section>
      <section className="panel">
        <h2>{editando?'Editar cadastro':'Novo produto ou serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Tipo *<select value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))}><option>Produto</option><option>Serviço</option></select></label>
            <label>Nome / descrição *<input required value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))} placeholder="Ex.: Filtro ARLA ou Diagnóstico eletrônico"/></label>
            <label>Valor de custo (R$)<input type="number" min="0" step="0.01" value={form.custo} onChange={e=>setForm(v=>{const custo=e.target.value;const valor=Number(custo)||0;return {...v,custo,preco:v.preco_manual?v.preco:(custo===''?'':(Math.round(valor*1.7*100)/100).toFixed(2))}})} placeholder="0,00"/></label>
            <label>Valor de venda (R$) *<input required type="number" min="0" step="0.01" value={form.preco} onChange={e=>setForm(v=>({...v,preco:e.target.value,preco_manual:true}))} placeholder="Calculado com 70% sobre o custo"/></label>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',paddingBottom:10}}>
              <span style={{fontSize:12}}>Venda sugerida: custo + 70%. Você pode alterar o preço.</span>
              <button type="button" onClick={()=>setForm(v=>({...v,preco_manual:false,preco:v.custo===''?'':(Math.round((Number(v.custo)||0)*1.7*100)/100).toFixed(2)}))}>Aplicar +70%</button>
            </div>
            <label>Fornecedor<input value={form.fornecedor} onChange={e=>setForm(v=>({...v,fornecedor:e.target.value}))} placeholder="Nome do fornecedor"/></label>
            {form.tipo==='Produto' && <>
              <label>Unidades por caixa<input type="number" min="1" step="1" value={form.quantidade_caixa} onChange={e=>setForm(v=>({...v,quantidade_caixa:e.target.value}))} placeholder="10"/></label>
              <label>Quantidade em estoque (unidades)<input type="number" min="0" step="1" value={form.quantidade_estoque} onChange={e=>setForm(v=>({...v,quantidade_estoque:e.target.value}))} placeholder="0"/></label>
            </>}
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Cadastrar'}</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio)}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>Produtos e serviços cadastrados <button type="button" onClick={carregar}>Atualizar</button></h2>

        {carregando?<p>Carregando...</p>:<table><thead><tr><th>Tipo</th><th>Produto / Serviço</th><th>Custo</th><th>Venda</th><th>Unid. / caixa</th><th>Estoque</th><th>Fornecedor</th><th>Ações</th></tr></thead><tbody>
          {filtrados.map(item=><tr key={item.id}><td>{item.tipo}</td><td>{item.nome}</td><td>{dinheiro(item.custo)}</td><td>{dinheiro(item.preco)}</td><td>{item.tipo==='Produto'?item.quantidade_caixa:'—'}</td><td>{item.tipo==='Produto'?item.quantidade_estoque:'—'}</td><td>{item.fornecedor||'—'}</td><td><div className="actions"><button type="button" className="btn-editar" onClick={()=>editar(item)}>Editar</button><button type="button" className="btn-excluir" disabled={excluindo===item.id} onClick={()=>excluir(item)}>{excluindo===item.id?"Excluindo...":"Excluir"}</button></div></td></tr>)}
          {!filtrados.length&&<tr><td colSpan={8}>Nenhum cadastro encontrado.</td></tr>}
        </tbody></table>}
      </section>
    </>
  }

  function Conteudo() {
    if (pagina === 'dashboard') return <Dashboard />
    if (pagina === 'empresas') return <Empresas />
    if (pagina === 'funil') return <Funil />
    if (pagina === 'oportunidades') return <Oportunidades />
    if (pagina === 'atendimentos') return <Atendimentos />
    if (pagina === 'agenda') return <Agenda />
    if (pagina === 'orcamentos') return <Orcamentos />
    if (pagina === 'ordens-servico') return <OrdensServico />
    if (pagina === 'catalogo') return <Catalogo />
    if (pagina === 'relatorios') return <Relatorios />
    if (pagina === 'importar') return <ImportarContatos />
    if (pagina === 'configuracoes') return <Configuracoes />
    return <Dashboard />
  }

  return (
    <div className="crm">
      <aside className="sidebar">
        <div className="brand">
          <a href="#" aria-label="Ir para o Dashboard" title="Voltar ao Dashboard" onClick={(event) => { event.preventDefault(); setPagina("dashboard") }} style={{ display: "inline-flex", cursor: "pointer" }}>
            <LogoMark className="brand-logo" />
          </a>
        </div>

        <nav>
          {MENU.map(([id, icone, nome]) => (
            <button
              key={id}
              className={pagina === id ? 'active' : ''}
              onClick={() => setPagina(id)}
            >
              <span>{icone}</span>
              {nome}
            </button>
          ))}
          <button type="button" className="logout-btn" onClick={sair} style={{ width: "100%", marginTop: "12px", textAlign: "left" }}>⇥&nbsp; Sair</button>
        </nav>

        <div className="sidebar-footer">
          <div className="online-dot"></div>
          <div>
            <b>Central Truck</b>
            <span>Sistema online</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="reference-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"24px",flexWrap:"nowrap",position:"relative",width:"100%",boxSizing:"border-box"}}>
          <div className="reference-brand" style={{flex:"0 1 auto",minWidth:0}}>
            <div className="reference-brand-name" style={{fontSize:"clamp(20px, 2.5vw, 34px)",fontWeight:900,letterSpacing:"0.015em",lineHeight:1.05,whiteSpace:"nowrap"}}>CENTRAL TRUCK <span style={{fontSize:"0.46em",letterSpacing:"0.12em",verticalAlign:"middle",whiteSpace:"nowrap"}}>★ SERVICE ★</span></div>
          </div>
          <a className="commercial-phone reference-whatsapp" style={{position:"absolute",right:"18px",top:"50%",transform:"translateY(-50%)",margin:0,flexShrink:0,display:"flex",alignItems:"center",gap:"10px"}} href="https://wa.me/5531975255079" target="_blank" rel="noreferrer">
            <img className="whatsapp-logo-img" src={ZAP_LOGO} alt="WhatsApp" />
            <span className="commercial-copy"><strong>(31) 97525-5079</strong></span>
          </a>
        </header>

        <div className="content">
          {erro && (
            <div className="error-box">
              <b>Não foi possível acessar os dados do Supabase.</b>
              <span>{erro}</span>
              <button onClick={carregarDados}>Tentar novamente</button>
            </div>
          )}

          {carregando ? (
            <div className="loading">
              <div className="loader"></div>
              <b>Carregando Central Truck CRM...</b>
              <span>Buscando informações do banco de dados.</span>
            </div>
          ) : (
            <Conteudo />
          )}
        </div>
      </main>
    </div>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento #root não encontrado no index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
,'Valor Vendido nos Últimos 30 Dias', dinheiro(valorUltimos30Dias)],
      ['R, dinheiro(valorOportunidades)],
      ['↗','Valor Vendido', dinheiro(valorVendido)],
      ['%','Conversão', `${conversao}%`],
      ['◷','Retornos Atrasados', atrasadas],
    ]
    return (
      <div className="dashboard-premium">
        <section className="dash-hero">
          <div>
            <small>Central Truck Service</small>
            <h1>Dashboard Comercial</h1>
            <p>Visão geral da operação comercial Truck exclusivo Danielle</p>
            <button className="primary" onClick={carregarDados}>↻ Atualizar dados</button>
          </div>
          <div className="hero-watermark hero-driving-scene"><img className="hero-truck-image" src={`${import.meta.env.BASE_URL}Caminhão Volvo FH 540 no Galpão Industrial.png`} alt="Volvo FH 540 em movimento" /><span className="truck-motion-streak streak-one" aria-hidden="true"></span><span className="truck-motion-streak streak-two" aria-hidden="true"></span><span className="truck-motion-streak streak-three" aria-hidden="true"></span></div>
        </section>

        <section className="kpi-grid">
          {kpis.map(([icone,titulo,valor]) => (
            <div className="kpi-card clickable-card" key={titulo} role="button" tabIndex="0" onClick={() => { const destinos={'Total de Leads':'empresas','Em Negociação':'funil','Vendas Realizadas':'orcamentos','Vendas nos Últimos 30 Dias':'orcamentos','Valor Vendido nos Últimos 30 Dias':'orcamentos','Valor em Oportunidades':'orcamentos','Valor Vendido':'orcamentos','Conversão':'relatorios','Retornos Atrasados':'agenda'}; setPagina(destinos[titulo] || 'dashboard') }} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')e.currentTarget.click()}}>
              <div className="kpi-icon">{icone}</div>
              <span>{titulo}</span>
              <strong>{valor}</strong>
              <small><b>Central Truck</b> · atualizado</small>
            </div>
          ))}
        </section>

        <div className="dashboard-lower">
          <section className="panel strategic-panel clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('oportunidades')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('oportunidades')}}>
            <div className="panel-heading"><div><h2>Serviços Estratégicos</h2><p>Principais soluções oferecidas pela Central Truck.</p></div></div>
            <div className="service-premium-grid">
              <img
                className="strategic-services-image"
                src={`${import.meta.env.BASE_URL}servicos-estrategicos.jpg`}
                alt="Serviços Estratégicos da Central Truck"
              />
            </div>
          </section>
          <section className="panel commercial-chart clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('relatorios')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('relatorios')}}>
            <div className="panel-heading"><div><h2>Resumo Comercial</h2><p>Evolução das vendas e oportunidades.</p></div></div>
            <div className="mini-bars">
              <div><span>Leads</span><i style={{height:`${Math.min(100,Math.max(8,empresas.length*12))}%`}}></i><b>{empresas.length}</b></div>
              <div><span>Oportunidades</span><i style={{height:`${Math.min(100,Math.max(8,oportunidades.length*16))}%`}}></i><b>{oportunidades.length}</b></div>
              <div><span>Vendas finalizadas</span><i style={{height:`${Math.min(100,Math.max(8,vendas.length*22))}%`}}></i><b>{vendas.length}</b></div>
              <div><span>Orçamentos</span><i style={{height:`${Math.min(100,Math.max(8,orcamentos.length*18))}%`}}></i><b>{orcamentos.length}</b></div>
            </div>
          </section>
        </div>

        <div className="dashboard-lower">
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Últimos Leads</h2><p>Empresas cadastradas recentemente.</p></div><button onClick={()=>setPagina('empresas')}>Ver todos →</button></div>
            {ultimosLeads.length ? ultimosLeads.map((e)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={e.id} onClick={()=>setPagina('empresas')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('empresas')}}><span className="list-avatar">{(e.nome_fantasia||e.nome||'C')[0]}</span><div><b>{e.nome_fantasia||e.nome}</b><small>{e.status||'Lead novo'}</small></div><em>{e.classificacao||'B'}</em></div>) : <div className="dash-empty">Nenhum lead cadastrado.</div>}
          </section>
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Agenda vinculada</h2><p>{tarefas.length} tarefa(s) cadastrada(s) • {proximasTarefas.length} próxima(s) exibida(s).</p></div><button onClick={()=>setPagina('agenda')}>Ver agenda →</button></div>
            {proximasTarefas.length ? proximasTarefas.map((t)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={t.id} onClick={()=>setPagina('agenda')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('agenda')}}><span className="list-avatar">◷</span><div><b>{t.titulo}</b><small>{nomeEmpresa(t.empresa_id)} · {dataBR(t.data_hora)}</small></div><em>{t.prioridade||'Normal'}</em></div>) : <div className="dash-empty">Nenhuma tarefa encontrada no banco de dados. Abra a Agenda para cadastrar ou atualizar.</div>}
          </section>
        </div>
      </div>
    )
  }

 async function baixarPlanilhaClientes() {
  if (!empresas.length) { alert('Não há clientes cadastrados para baixar.'); return }

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Central Truck Service'
  workbook.created = new Date()
  const ws = workbook.addWorksheet('Clientes', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
    },
    views: [{ state: 'frozen', ySplit: 6 }]
  })

  const colunas = [
    ['Empresa',28],['Nome fantasia',28],['CNPJ',20],['Classificação',14],
    ['Segmento',20],['Cidade',20],['Estado',10],['Telefone',18],
    ['WhatsApp',18],['E-mail',30],['Site',28],['Status',20],
    ['Data do cadastro',18],['Observações',40]
  ]
  ws.columns = colunas.map(([header,width]) => ({ header, width }))
  ws.spliceRows(1, 1)
  ws.mergeCells('A1:N3')
  ws.mergeCells('A4:N4')
  ws.mergeCells('A5:N5')
  ws.getCell('A1').value = 'CENTRAL TRUCK SERVICE'
  ws.getCell('A4').value = 'RELATÓRIO DE CLIENTES / LEADS'
  ws.getCell('A5').value = 'Gestão Comercial • Exportado em ' + new Date().toLocaleString('pt-BR')

  const verde = 'FF19E6A2', escuro = 'FF061914', escuro2 = 'FF0B2A21', branco = 'FFFFFFFF', cinza = 'FFDCE9E4'
  ;['A1','A4','A5'].forEach((ref) => {
    ws.getCell(ref).alignment = { vertical:'middle', horizontal:'center' }
    ws.getCell(ref).fill = { type:'pattern', pattern:'solid', fgColor:{argb:escuro} }
    ws.getCell(ref).font = { color:{argb: ref==='A4' ? verde : branco}, bold:true, size: ref==='A1' ? 24 : ref==='A4' ? 16 : 10 }
  })
  ws.getRow(1).height = 32; ws.getRow(2).height = 18; ws.getRow(3).height = 18
  ws.getRow(4).height = 26; ws.getRow(5).height = 22

  const headerRow = ws.getRow(6)
  colunas.forEach(([titulo],i) => headerRow.getCell(i+1).value = titulo)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:verde} }
    cell.font = { color:{argb:'FF00140E'}, bold:true, size:10 }
    cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true }
    cell.border = { bottom:{style:'medium',color:{argb:'FF00A875'}} }
  })

  empresas.forEach((empresa,idx) => {
    const row = ws.addRow([
      empresa.nome || '', empresa.nome_fantasia || '', empresa.cnpj || '',
      empresa.classificacao || '', empresa.segmento || '', empresa.cidade || '',
      empresa.estado || '', empresa.telefone || '', empresa.whatsapp || '',
      empresa.email || '', empresa.site || '', empresa.status || '',
      dataBR(empresa.criado_em), empresa.observacoes || ''
    ])
    row.height = 24
    row.eachCell({includeEmpty:true}, (cell) => {
      cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb: idx%2===0 ? 'FFF5FAF8' : branco} }
      cell.font = { color:{argb:'FF17352C'}, size:10 }
      cell.alignment = { vertical:'middle', wrapText:true }
      cell.border = { bottom:{style:'thin',color:{argb:cinza}} }
    })
  })

  ws.autoFilter = { from:'A6', to:'N' + (empresas.length + 6) }
  ws.headerFooter.oddHeader = '&C&B CENTRAL TRUCK SERVICE'
  ws.headerFooter.oddFooter = '&LRelatório de Clientes&CConfidencial&R&P de &N'
  ws.pageSetup.printTitlesRow = '1:6'
  ws.pageSetup.printArea = 'A1:N' + (empresas.length + 6)

  try {
    const resposta = await fetch(LOGO)
    const blob = await resposta.blob()
    const base64 = await new Promise((resolve,reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const ext = blob.type.includes('png') ? 'png' : 'jpeg'
    const logoId = workbook.addImage({ base64, extension:ext })
    ws.addImage(logoId, { tl:{col:0.15,row:0.15}, ext:{width:125,height:72}, editAs:'oneCell' })
  } catch (e) { console.warn('Logo não inserida no Excel:', e) }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'Clientes_Central_Truck_' + new Date().toISOString().slice(0,10) + '.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

function Empresas() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const formularioEmpresaRef = React.useRef(null)
  const [salvando, setSalvando] = useState(false)
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
   const [empresaEditando, setEmpresaEditando] = useState(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState([])
  const [buscaEmpresa, setBuscaEmpresa] = useState('')
  const [filtroStatusEmpresa, setFiltroStatusEmpresa] = useState('')
  const [buscaAgenda, setBuscaAgenda] = useState('')
  const [form, setForm] = useState({
    nome: '',
    nome_fantasia: '',
    pessoa_contato: '',
    cnpj: '',
    segmento: '',
    classificacao: 'B',
    status: 'Lead novo',
    cidade: '',
    estado: 'MG',
    telefone: '',
    whatsapp: '',
    email: '',
    site: '',
    observacoes: ''
  })

  function limparCadastro() {
    sessionStorage.removeItem('empresa_rascunho')
    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    setEmpresaEditando(null)
    setForm({
      nome: '', nome_fantasia: '', pessoa_contato: '', cnpj: '',
      segmento: '', classificacao: 'B', status: 'Lead novo',
      cidade: '', estado: 'MG', telefone: '', whatsapp: '',
      email: '', site: '', observacoes: ''
    })
  }

  useEffect(() => {
    const rascunho = sessionStorage.getItem('centraltruck_empresa_em_edicao')
    if (rascunho) {
      try {
        const dados = JSON.parse(rascunho)
        if (dados && typeof dados === 'object') {
          setForm(dados)
          setMostrarFormulario(true)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (mostrarFormulario && !empresaEditando && form.nome.trim()) {
      sessionStorage.setItem('centraltruck_empresa_em_edicao', JSON.stringify(form))
    }
  }, [form, mostrarFormulario, empresaEditando])

  function alterarCampo(e) {
    const { name, value } = e.target
    setForm((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }
function editarEmpresa(empresa) {
  setEmpresaEditando(empresa)

  setForm({
    nome: empresa.nome || '',
    nome_fantasia: empresa.nome_fantasia || '',
    pessoa_contato: empresa.pessoa_contato || '',
    cnpj: empresa.cnpj || '',
    segmento: empresa.segmento === 'Diesel' ? 'Oficina - Diesel' : (empresa.segmento || ''),
    classificacao: empresa.classificacao || 'B',
    status: empresa.status || 'Lead novo',
    cidade: empresa.cidade || '',
    estado: empresa.estado || 'MG',
    telefone: empresa.telefone || '',
    whatsapp: empresa.whatsapp || '',
    email: empresa.email || '',
    site: empresa.site || '',
    observacoes: empresa.observacoes || ''
  })

  setMensagem('')
  setMostrarFormulario(true)
  requestAnimationFrame(() => {
    formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
async function excluirSelecionados() {
  if (!leadsSelecionados.length) {
    alert('Selecione pelo menos um Lead.')
    return
  }
  if (!window.confirm('Excluir os ' + leadsSelecionados.length + ' Leads selecionados?')) return

  const lote = 100
  for (let inicio = 0; inicio < leadsSelecionados.length; inicio += lote) {
    const ids = leadsSelecionados.slice(inicio, inicio + lote)

    const funil = await supabase.from('oportunidades').delete().in('empresa_id', ids)
    if (funil.error) {
      alert('Erro ao limpar os vínculos do Funil: ' + funil.error.message)
      await carregarDados()
      return
    }

    const resultado = await supabase.from('empresas').delete().in('id', ids)
    if (resultado.error) {
      alert('Erro ao excluir os Leads selecionados: ' + resultado.error.message)
      await carregarDados()
      return
    }
  }

  setLeadsSelecionados([])
  await carregarDados()
  alert('Leads selecionados excluídos com sucesso.')
}

async function excluirEmpresa(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir esta empresa? Esta ação não poderá ser desfeita.'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('Erro ao excluir empresa: ' + error.message)
    return
  }

  await carregarDados()
}
  async function salvarEmpresa(e) {
    e.preventDefault()

    if (!form.nome.trim()) {
      setMensagem('Informe o nome da empresa.')
      return
    }

    setSalvando(true)
    setMensagem('')

    const { pessoa_contato, ...camposBanco } = form
    const dados = {
      ...camposBanco,
      nome: form.nome.trim(),
      nome_fantasia: form.nome_fantasia.trim() || null,
      cnpj: form.cnpj.trim() || null,
      segmento: form.segmento.trim() || null,
      cidade: form.cidade.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      observacoes: form.observacoes.trim() || null
    }

    let resultado

if (empresaEditando) {
  resultado = await supabase
    .from('empresas')
    .update(dados)
    .eq('id', empresaEditando.id)
} else {
  resultado = await supabase
    .from('empresas')
    .insert([dados])
    .select('id')
}

const { error } = resultado


    if (error) {
      console.error(error)
      setMensagem('Erro ao cadastrar empresa: ' + error.message)
      setSalvando(false)
      return
    }

    setMensagem(empresaEditando ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!')
    sessionStorage.removeItem('empresa_rascunho')

    setForm({
      nome: '',
      nome_fantasia: '',
      pessoa_contato: '',
      cnpj: '',
      segmento: '',
      classificacao: 'B',
      status: 'Lead novo',
      cidade: '',
      estado: 'MG',
      telefone: '',
      whatsapp: '',
      email: '',
      site: '',
      observacoes: ''
    })

    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    await carregarDados()
    setSalvando(false)
    setEmpresaEditando(null)
    // Manter o formulario aberto e limpo para o proximo cadastro.
    setMostrarFormulario(true)
    requestAnimationFrame(() => {
      formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Empresas / Leads</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.4' }}>Base comercial de clientes e potenciais clientes.</p>
        </div>

        <button
          className="primary"
          onClick={() => {
            setMensagem('')
            if (mostrarFormulario) {
              setMostrarFormulario(false)
              limparCadastro()
            } else {
              limparCadastro()
              setMostrarFormulario(true)
            }
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nova Empresa'}
        </button>
        <button type="button" className="btn-exportar" onClick={baixarPlanilhaClientes}>
          ↓ Baixar planilha de clientes
        </button>
      </div>

      {mensagem && (
        <section className="panel" style={{ marginBottom: '16px' }}>
          <strong>{mensagem}</strong>
        </section>
      )}

      {mostrarFormulario && (
        <section ref={formularioEmpresaRef} className="panel" style={{ marginBottom: '20px', scrollMarginTop: '24px' }}>
          <h2>{empresaEditando ? 'Editar Empresa' : 'Nova Empresa'}</h2>

          <form onSubmit={salvarEmpresa}>
            <div className="form-grid">
              <label>
                Nome da empresa *
                <input
                  name="nome"
                  value={form.nome}
                  onChange={alterarCampo}
                  required
                />
              </label>

              <label>
                Pessoa de contato
                <input
                  name="pessoa_contato"
                  value={form.pessoa_contato}
                  onChange={alterarCampo}
                  placeholder="Ex.: Gustavo"
                />
              </label>

              <label>
                CNPJ
                <input
                  name="cnpj"
                  value={form.cnpj}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Segmento
                <select
                  name="segmento"
                  value={form.segmento}
                  onChange={alterarCampo}
                >
                  <option value="">Selecione o segmento</option>
                  <option value="Transportadora">Transportadora</option>
                  <option value="Frota Própria">Frota Própria</option>
                  <option value="Frota Terceirizada">Frota Terceirizada</option>
                  <option value="Troca de Óleo">Troca de Óleo</option>
                  <option value="Oficina - Diesel">Oficina - Diesel</option>
                  <option value="Elétrica">Elétrica</option>
                  <option value="Pessoa Física">Pessoa Física</option>
                </select>
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={alterarCampo}
                >
                  <option>Lead novo</option>
                  <option>Primeiro contato</option>
                  <option>Interessado</option>
                  <option>Visita agendada</option>
                  <option>Orçamento enviado</option>
                  <option>Em negociação</option>
                  <option>Venda realizada</option>
                  <option>Venda perdida</option>
                  <option>Pós-venda</option>
                  <option>Já é cliente</option>
                  <option>Concorrente</option>
                  <option>Futuro parceiro</option>
                  <option>Não atendeu, ligar novamente</option>
                  <option>Cliente de outro vendedor</option>
                  </select>
              </label>

              <label>
                Cidade
                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Estado
                <input
                  name="estado"
                  value={form.estado}
                  onChange={alterarCampo}
                  maxLength="2"
                />
              </label>

              <label>
                Telefone
                <input
                  name="telefone"
                  value={form.telefone}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                WhatsApp
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={alterarCampo}
                />
              </label>
            </div>

            <label style={{ display: 'block', marginTop: '14px' }}>
              Observações
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={alterarCampo}
                rows="4"
              />
            </label>

            <div style={{ marginTop: '12px', color: 'var(--muted)', fontSize: '13px' }}>Após salvar, você poderá selecionar esta empresa na seção “Agendar novo contato” abaixo.</div>
            <div style={{ marginTop: '16px' }}>
              <button
                className="primary"
                type="submit"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Empresa'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel" style={{ marginBottom: '16px' }}>
        <h3>Agendar novo contato</h3>
        <p>Selecione uma empresa cadastrada para criar um retorno diretamente na Agenda.</p>
        <input aria-label="Buscar empresa para agendar" placeholder="🔎 Buscar empresa pelo nome..." value={buscaAgenda} onChange={e => setBuscaAgenda(e.target.value)} style={{width:'100%',maxWidth:'480px',marginBottom:'8px'}} />
        <select id="empresa-agenda-rapida" defaultValue="" style={{ width: '100%', maxWidth: '480px', marginRight: '12px' }}>
          <option value="">Selecione uma empresa</option>
          {empresas.filter(empresa => normalizarBusca(empresa.nome_fantasia || empresa.nome).includes(normalizarBusca(buscaAgenda))).map(empresa => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia || empresa.nome}</option>)}
        </select>
        <button type="button" className="primary" style={{ background: '#444B54', backgroundColor: '#444B54', color: '#FFFFFF', border: '1px solid #626A74' }} onClick={() => {
          const id = document.getElementById('empresa-agenda-rapida')?.value
          if (!id) { alert('Selecione uma empresa antes de agendar.'); return }
          sessionStorage.setItem('centraltruck_agendar_empresa', id)
          setPagina('agenda')
        }}>+ Agendar novo contato</button>
      </section>

      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px'}}>
        <input aria-label="Buscar na lista de empresas" placeholder="🔎 Buscar cliente, telefone, cidade ou observações..." value={buscaEmpresa} onChange={e => setBuscaEmpresa(e.target.value)} style={{flex:'2 1 320px',minWidth:0}} />
        <select aria-label="Filtrar clientes por situação" value={filtroStatusEmpresa} onChange={e => setFiltroStatusEmpresa(e.target.value)} style={{flex:'1 1 220px',minWidth:0}}>
          <option value="">Todas as situações</option>
          <option value="Não atendeu, ligar novamente">Não atendeu / ligar novamente</option>
          {[...new Set(empresas.map(e => e.status).filter(Boolean))].filter(status => status !== 'Não atendeu, ligar novamente').sort((a,b)=>a.localeCompare(b,'pt-BR')).map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        {(buscaEmpresa || filtroStatusEmpresa) && <button type="button" onClick={()=>{setBuscaEmpresa('');setFiltroStatusEmpresa('')}}>Limpar filtros</button>}
      </div>
      <section className="panel table-wrap">
        {leadsSelecionados.length > 0 && (
          <div className="selection-toolbar">
            <strong>{leadsSelecionados.length} selecionado(s)</strong>
            <button type="button" className="btn-excluir" onClick={excluirSelecionados}>Excluir selecionados</button>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th className="select-col"><input type="checkbox" aria-label="Selecionar todos" checked={empresas.length > 0 && leadsSelecionados.length === empresas.length} onChange={(e)=>setLeadsSelecionados(e.target.checked ? empresas.map((item)=>item.id) : [])} /></th>
              <th>Empresa</th>
              <th>Segmento</th>
              <th>Cidade</th>
              <th>Telefone</th>
              <th>Status</th><th>Data do cadastro</th><th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {empresas.length > 0 ? (
              empresas.filter(empresa => (!filtroStatusEmpresa || empresa.status === filtroStatusEmpresa) && normalizarBusca([empresa.nome, empresa.nome_fantasia, empresa.telefone, empresa.whatsapp, empresa.cidade, empresa.segmento, empresa.status, empresa.pessoa_contato, empresa.observacoes].join(' ')).includes(normalizarBusca(buscaEmpresa))).map((empresa) => (
                <tr key={empresa.id}>
                  <td className="select-col"><input type="checkbox" aria-label={'Selecionar ' + (empresa.nome_fantasia || empresa.nome)} checked={leadsSelecionados.includes(empresa.id)} onChange={(e)=>setLeadsSelecionados((atuais)=>e.target.checked ? [...atuais, empresa.id] : atuais.filter((id)=>id !== empresa.id))} /></td>
                  <td>{empresa.nome}</td>
                  <td>{empresa.segmento || '-'}</td>
                  <td>
                    {empresa.cidade || '-'}
                    {empresa.estado ? ` / ${empresa.estado}` : ''}
                  </td>
                  <td>{empresa.telefone || empresa.whatsapp || '-'}</td>
                 <td>{empresa.status || '-'}</td>
<td>{dataBR(empresa.criado_em)}</td>
<td>
 
  <button
    type="button"
    onClick={() => editarEmpresa(empresa)}
    className="btn-editar"
  >
    Editar
  </button>

  <button
    type="button"
    onClick={() => excluirEmpresa(empresa.id)}
    className="btn-excluir"
  >
    Excluir
  </button>
</td>
                </tr>
              ))
            ) : (
              <tr>
<td colSpan="8" style={{ textAlign: 'center' }}>                 
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}

function Decisores() {
  const [contatos, setContatos] = useState([])
const [empresas, setEmpresas] = useState([])
const [mostrarFormDecisor, setMostrarFormDecisor] = useState(false)
const [salvandoDecisor, setSalvandoDecisor] = useState(false)
const [mensagemDecisor, setMensagemDecisor] = useState('')
    const [decisorEditandoId, setDecisorEditandoId] = useState(null)

const [formDecisor, setFormDecisor] = useState({
  empresa_id: '',
  nome: '',
  cargo: '',
  telefone: '',
  whatsapp: '',
  email: ''
})

    async function carregarDecisores() {
    const { data, error } = await supabase
      .from('contatos')
      .select(`
        *,
        empresas (
          nome
        )
      `)
      .order('nome')

    if (error) {
      console.error('Erro ao carregar decisores:', error)
      return
    }

    setContatos(data || [])
  }

  async function carregarEmpresasDecisor() {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome')
      .order('nome')

    if (error) {
      console.error('Erro ao carregar empresas:', error)
      return
    }

    setEmpresas(data || [])
  }

  useEffect(() => {
    carregarDecisores()
    carregarEmpresasDecisor()
  }, [])
    async function salvarDecisor(e) {
    e.preventDefault()
    setSalvandoDecisor(true)
    setMensagemDecisor('')

    if (!formDecisor.empresa_id || !formDecisor.nome) {
      setMensagemDecisor('Selecione a empresa e informe o nome do decisor.')
      setSalvandoDecisor(false)
      return
    }

    const dadosDecisor = {
      empresa_id: formDecisor.empresa_id,
      nome: formDecisor.nome,
      cargo: formDecisor.cargo || null,
      telefone: formDecisor.telefone || null,
      whatsapp: formDecisor.whatsapp || null,
      email: formDecisor.email || null,
      principal: true
    }
    const consultaDecisor = decisorEditandoId
      ? supabase.from('contatos').update(dadosDecisor).eq('id', decisorEditandoId)
      : supabase.from('contatos').insert([dadosDecisor])
    const { error } = await consultaDecisor

    if (error) {
      console.error('Erro ao salvar decisor:', error)
alert('Erro ao salvar decisor: ' + error.message)
  setSalvandoDecisor(false)
      return
    }

    setFormDecisor({
      empresa_id: '',
      nome: '',
      cargo: '',
      telefone: '',
      whatsapp: '',
      email: ''
    })

    setMensagemDecisor(decisorEditandoId ? 'Decisor atualizado com sucesso!' : 'Decisor cadastrado com sucesso!')
    setDecisorEditandoId(null)
    setMostrarFormDecisor(false)
    setSalvandoDecisor(false)
    await carregarDecisores()
  }

  function editarDecisor(contato) {
    setFormDecisor({
      empresa_id: contato.empresa_id || '',
      nome: contato.nome || '',
      cargo: contato.cargo || '',
      telefone: contato.telefone || '',
      whatsapp: contato.whatsapp || '',
      email: contato.email || ''
    })
    setDecisorEditandoId(contato.id)
    setMostrarFormDecisor(true)
  }

  async function excluirDecisor(id) {
  const confirmar = window.confirm('Tem certeza que deseja excluir este decisor?')

  if (!confirmar) return

  const { error } = await supabase
    .from('contatos')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir decisor: ' + error.message)
    return
  }

  await carregarDecisores()
}
  
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Decisores</h1>
            <p>Contatos responsáveis pelas decisões comerciais.</p>
          </div>
          <button
  className="btn-primary"
  onClick={() => { setDecisorEditandoId(null); setFormDecisor({ empresa_id:'', nome:'', cargo:'', telefone:'', whatsapp:'', email:'' }); setMostrarFormDecisor(true) }}
>
  + Novo Decisor
</button>
        </div>

        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Cargo</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>WhatsApp</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contatos.map((contato) => (
                <tr key={contato.id}>
                  <td><b>{contato.nome}</b></td>
                  <td>{nomeEmpresa(contato.empresa_id)}</td>
                  <td>{contato.cargo || '—'}</td>
                  <td>{contato.telefone || '—'}</td>
                  <td>{contato.email || '—'}</td>
                  <td>
                    {contato.whatsapp ? (
                      <a
                        className="whatsapp"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://wa.me/55${String(
                          contato.whatsapp
                        ).replace(/\D/g, '')}`}
                      >
                        Abrir WhatsApp
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                
        <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarDecisor(contato)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirDecisor(contato.id)}>Excluir</button></div></td>
  </tr>           
      ))}
              {!contatos.length && (
                <tr>
                  <td colSpan="7" className="empty">
                    Nenhum decisor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        {mostrarFormDecisor && (
  <section className="panel">
    <h2>{decisorEditandoId ? 'Editar Decisor' : 'Novo Decisor'}</h2>

<form onSubmit={salvarDecisor}>
  <label>Empresa</label>
      <select
        value={formDecisor.empresa_id}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, empresa_id: e.target.value })
        }
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome}
          </option>
        ))}
      </select>

      <label>Nome</label>
      <input
        type="text"
        value={formDecisor.nome}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, nome: e.target.value })
        }
      />

      <label>Cargo</label>
      <input
        type="text"
        value={formDecisor.cargo}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, cargo: e.target.value })
        }
      />

      <label>Telefone</label>
      <input
        type="text"
        value={formDecisor.telefone}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, telefone: e.target.value })
        }
      />

      <label>WhatsApp</label>
      <input
        type="text"
        value={formDecisor.whatsapp}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, whatsapp: e.target.value })
        }
      />

      <label>E-mail</label>
      <input
        type="email"
        value={formDecisor.email}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, email: e.target.value })
        }
      />

     <button type="submit" className="btn-primary" disabled={salvandoDecisor}>
{salvandoDecisor ? 'Salvando...' : 'Salvar Decisor'}
     </button>

      <button
        type="button"
        onClick={() => setMostrarFormDecisor(false)}
      >
        Cancelar
      </button>
    </form>
  </section>
)}
      </>
    )
  }

  async function excluirOportunidade(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta oportunidade?')) return
    const { error } = await supabase.from('oportunidades').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir oportunidade: ' + error.message)
      return
    }
    await carregarDados()
  }

  function Funil() {
    const [agendamentosFunil, setAgendamentosFunil] = useState({})

    async function agendarEEnviarWhatsApp(item) {
      const dataHora = agendamentosFunil[item.id]
      if (!dataHora) {
        alert('Selecione a data e a hora do agendamento.')
        return
      }

      const empresaNome = nomeEmpresa(item.empresa_id)
      const dataFormatada = new Date(dataHora).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })

      const { error } = await supabase.from('tarefas').insert([{
        empresa_id: item.empresa_id || null,
        titulo: 'Agendamento - ' + (item.titulo || empresaNome),
        descricao: 'Agendamento criado pelo Funil Comercial. Etapa: ' + item.etapa,
        data_hora: dataHora,
        prioridade: 'Normal',
        status: 'Pendente'
      }])

      if (error) {
        alert('Erro ao salvar o agendamento: ' + error.message)
        return
      }

      await carregarDados()

      const mensagem = [
        '📅 *AGENDAMENTO CENTRAL TRUCK*',
        '',
        'Empresa: ' + empresaNome,
        'Oportunidade: ' + (item.titulo || '-'),
        'Etapa: ' + item.etapa,
        'Data e hora: ' + dataFormatada
      ].join('\n')

      window.open('https://wa.me/5531975255079?text=' + encodeURIComponent(mensagem), '_blank', 'noopener,noreferrer')
    }

    const etapas = [
      'Lead Novo',
      'Primeiro Contato',
      'Interessado',
      'Visita Agendada',
      'Orçamento Enviado',
      'Em Negociação',
      'Venda Realizada',
      'Venda Perdida',
      'Pós-venda',
    ]


    async function moverOportunidade(id, novaEtapa) {
  const { error } = await supabase
    .from('oportunidades')
    .update({ etapa: novaEtapa })
    .eq('id', id)

  if (error) {
    alert('Erro ao alterar etapa: ' + error.message)
    return
  }

  await carregarDados()
}
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Funil Comercial</h1>
            <p>Acompanhamento das oportunidades por etapa.</p>
          </div>
        </div>

        <div className="kanban">
          {etapas.map((etapa) => {
            const itens = oportunidades.filter((o) => o.etapa === etapa)

            return (
              <div className="kanban-column" key={etapa}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.outline = '2px solid #19df91' }}
                onDragLeave={(e) => { e.currentTarget.style.outline = '' }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.outline = ''
                  const id = e.dataTransfer.getData('text/plain')
                  const item = oportunidades.find(o => String(o.id) === id)
                  if (item && item.etapa !== etapa) moverOportunidade(item.id, etapa)
                }}>
                <div className="kanban-title">
                  <b>{etapa}</b>
                  <span>{itens.length}</span>
                </div>

                {itens.map((item) => (
                 <details className="deal" key={item.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(item.id)); e.dataTransfer.effectAllowed = "move" }} style={{padding:"10px 12px",minHeight:0,cursor:"grab"}}>
  <summary style={{cursor:"pointer",fontWeight:700,listStyle:"revert",overflowWrap:"anywhere"}}>{nomeEmpresa(item.empresa_id) || item.titulo}</summary>
  <div style={{display:"grid",gap:"8px",marginTop:"12px"}}>
  <b>{item.titulo || nomeEmpresa(item.empresa_id)}</b>
  <strong>{dinheiro(item.valor_estimado)}</strong>



  <label className="deal-schedule-label">
    Data e hora do agendamento
    <input
      className="deal-schedule-input"
      type="datetime-local"
      value={agendamentosFunil[item.id] || ''}
      onChange={(e) => setAgendamentosFunil({ ...agendamentosFunil, [item.id]: e.target.value })}
    />
  </label>
  <button type="button" className="btn-whatsapp" onClick={() => agendarEEnviarWhatsApp(item)}>
    Agendar e enviar no WhatsApp
  </button>
  <button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button>
</div>
</details>
                ))}

                {!itens.length && (
                  <div className="kanban-empty">Nenhuma oportunidade</div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  function Oportunidades() {
      const [mostrarFormOportunidade, setMostrarFormOportunidade] = useState(false)
  const [salvandoOportunidade, setSalvandoOportunidade] = useState(false)
  const [mensagemOportunidade, setMensagemOportunidade] = useState('')
  const [selecionadas, setSelecionadas] = useState([])
  const [excluindoLote, setExcluindoLote] = useState(false)
  async function excluirSelecionadas() {
    if (!selecionadas.length || excluindoLote) return
    if (!window.confirm('Excluir definitivamente ' + selecionadas.length + ' oportunidade(s) selecionada(s)? Os cadastros das empresas serão preservados.')) return
    setExcluindoLote(true)
    const {error} = await supabase.from('oportunidades').delete().in('id', selecionadas)
    setExcluindoLote(false)
    if (error) { alert('Não foi possível excluir: ' + error.message); return }
    setSelecionadas([])
    await carregarDados()
  }

  const [formOportunidade, setFormOportunidade] = useState({
    empresa_id: '',
    titulo: '',
    servico: '',
    etapa: 'Lead Novo',
    valor_estimado: '',
    probabilidade: 0,
    previsao_fechamento: '',
    observacoes: ''
  })

  async function salvarOportunidade(e) {
    e.preventDefault()

    if (!formOportunidade.empresa_id || !formOportunidade.titulo) {
      setMensagemOportunidade('Selecione a empresa e informe o título da oportunidade.')
      return
    }

    setSalvandoOportunidade(true)
    setMensagemOportunidade('')

    const { error } = await supabase
      .from('oportunidades')
      .insert([{
        empresa_id: formOportunidade.empresa_id,
        titulo: formOportunidade.titulo,
        servico: formOportunidade.servico || null,
        etapa: formOportunidade.etapa,
        valor_estimado: formOportunidade.valor_estimado
          ? Number(formOportunidade.valor_estimado)
          : null,
        probabilidade: Number(formOportunidade.probabilidade) || 0,
        previsao_fechamento: formOportunidade.previsao_fechamento || null,
        observacoes: formOportunidade.observacoes || null
      }])

    if (error) {
      alert('Erro ao salvar oportunidade: ' + error.message)
      setSalvandoOportunidade(false)
      return
    }

    setFormOportunidade({
      empresa_id: '',
      titulo: '',
      servico: '',
      etapa: 'Lead Novo',
      valor_estimado: '',
      probabilidade: 0,
      previsao_fechamento: '',
      observacoes: ''
    })

    setMensagemOportunidade('Oportunidade cadastrada com sucesso!')
    setMostrarFormOportunidade(false)
    setSalvandoOportunidade(false)

    await carregarDados()
  }
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Oportunidades</h1>
            <p>Negociações comerciais em andamento.</p>
          </div>
        </div>
<button
  type="button"
  className="btn-primary"
  onClick={() => setMostrarFormOportunidade(true)}
>
  + Nova Oportunidade
</button>
<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginTop:12,marginBottom:12}}>
  <button type="button" onClick={()=>setSelecionadas(oportunidades.map(o=>o.id))}>Selecionar todas</button>
  <button type="button" onClick={()=>setSelecionadas([])}>Limpar seleção</button>
  <button type="button" className="btn-excluir" disabled={!selecionadas.length || excluindoLote} onClick={excluirSelecionadas}>
    {excluindoLote ? 'Excluindo...' : 'Excluir selecionadas ('+selecionadas.length+')'}
  </button>
</div>

{mensagemOportunidade && (
  <p>{mensagemOportunidade}</p>
)}
        {mostrarFormOportunidade && (
  <section className="panel">
    <h2>Nova Oportunidade</h2>

    <form onSubmit={salvarOportunidade}>

      <label>Empresa</label>
      <select
        value={formOportunidade.empresa_id}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            empresa_id: e.target.value
          })
        }
        required
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome_fantasia || empresa.nome}
          </option>
        ))}
      </select>

      <label>Título da oportunidade</label>
      <input
        type="text"
        value={formOportunidade.titulo}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            titulo: e.target.value
          })
        }
        placeholder="Ex.: Manutenção sistema ARLA"
        required
      />

      <label>Serviço</label>
      <select
        value={formOportunidade.servico}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            servico: e.target.value
          })
        }
      >
        <option value="">Selecione</option>
        <option value="Catalisador">Catalisador</option>
        <option value="ARLA 32">ARLA 32</option>
        <option value="Diálise">Diálise</option>
        <option value="Diagnóstico">Diagnóstico</option>
        <option value="Sistema SCR">Sistema SCR</option>
        <option value="DPF">DPF</option>
        <option value="Injeção Diesel">Injeção Diesel</option>
        <option value="Elétrica">Elétrica</option>
        <option value="Mecânica Diesel">Mecânica Diesel</option>
      </select>

      <label>Etapa</label>
      <select
        value={formOportunidade.etapa}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            etapa: e.target.value
          })
        }
      >
        <option value="Lead Novo">Lead Novo</option>
        <option value="Primeiro Contato">Primeiro Contato</option>
        <option value="Interessado">Interessado</option>
        <option value="Visita Agendada">Visita Agendada</option>
        <option value="Orçamento Enviado">Orçamento Enviado</option>
        <option value="Em Negociação">Em Negociação</option>
        <option value="Venda Realizada">Venda Realizada</option>
        <option value="Venda Perdida">Venda Perdida</option>
        <option value="Pós-venda">Pós-venda</option>
                  <option value="Já é cliente">Já é cliente</option>
      </select>

      <label>Valor estimado (R$)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={formOportunidade.valor_estimado}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            valor_estimado: e.target.value
          })
        }
      />

      <label>Probabilidade (%)</label>
      <input
        type="number"
        min="0"
        max="100"
        value={formOportunidade.probabilidade}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            probabilidade: e.target.value
          })
        }
      />

      <label>Previsão de fechamento</label>
      <input
        type="date"
        value={formOportunidade.previsao_fechamento}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            previsao_fechamento: e.target.value
          })
        }
      />

      <label>Observações</label>
      <textarea
        value={formOportunidade.observacoes}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            observacoes: e.target.value
          })
        }
      />

      <div>
        <button
          type="submit"
          className="btn-primary"
          disabled={salvandoOportunidade}
        >
          {salvandoOportunidade ? 'Salvando...' : 'Salvar Oportunidade'}
        </button>

        <button
          type="button"
          onClick={() => setMostrarFormOportunidade(false)}
        >
          Cancelar
        </button>
      </div>

    </form>
  </section>
)}
        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Selecionar todas as oportunidades" checked={oportunidades.length>0 && oportunidades.every(o=>selecionadas.includes(o.id))} onChange={e=>setSelecionadas(e.target.checked?oportunidades.map(o=>o.id):[])} /></th>
                <th>Oportunidade</th>
                <th>Empresa</th>
                <th>Serviço</th>
                <th>Etapa</th>
                <th>Valor</th>
                <th>Probabilidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" aria-label={'Selecionar '+(item.titulo||'oportunidade')} checked={selecionadas.includes(item.id)} onChange={e=>setSelecionadas(v=>e.target.checked?[...v,item.id]:v.filter(id=>id!==item.id))}/></td>
                  <td><b>{item.titulo || 'Oportunidade'}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.servico || '—'}</td>
                  <td><span className="status">{item.etapa}</span></td>
                  <td>{dinheiro(item.valor_estimado)}</td>
                  <td>{item.probabilidade || 0}%</td>
                  <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarOportunidade(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button></div></td>
                </tr>
              ))}

              {!oportunidades.length && (
                <tr>
                  <td colSpan="8" className="empty">
                    Nenhuma oportunidade cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </>
    )
  }
function Atendimentos() {
  const [mostrarFormAtendimento, setMostrarFormAtendimento] = useState(false)
const [salvandoAtendimento, setSalvandoAtendimento] = useState(false)
const [mensagemAtendimento, setMensagemAtendimento] = useState('')
const [atendimentoEditandoId, setAtendimentoEditandoId] = useState(null)

const [formAtendimento, setFormAtendimento] = useState({
  empresa_id: '',
  tipo: 'Ligação',
  descricao: '',
  data_atividade: new Date().toISOString().slice(0, 10),
  proximo_retorno: '',
  concluido: false
})

function editarAtendimento(item) {
  setFormAtendimento({
    empresa_id: item.empresa_id || '',
    tipo: item.tipo || 'Ligação',
    descricao: item.descricao || '',
    data_atividade: item.data_atividade ? String(item.data_atividade).slice(0,10) : new Date().toISOString().slice(0,10),
    proximo_retorno: item.proximo_retorno ? String(item.proximo_retorno).slice(0,10) : '',
    concluido: !!item.concluido
  })
  setAtendimentoEditandoId(item.id)
  setMostrarFormAtendimento(true)
}

async function excluirAtendimento(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir este atendimento?'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('atividades')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir atendimento: ' + error.message)
    return
  }

  await carregarDados()
} 
  async function salvarAtendimento(e) {
  e.preventDefault()

  if (!formAtendimento.empresa_id || !formAtendimento.descricao) {
    alert('Selecione a empresa e informe a descrição do atendimento.')
    return
  }

  setSalvandoAtendimento(true)

  const dadosAtendimento = {
    empresa_id: Number(formAtendimento.empresa_id),
    tipo: formAtendimento.tipo,
    descricao: formAtendimento.descricao,
    data_atividade: formAtendimento.data_atividade,
    proximo_retorno: formAtendimento.proximo_retorno || null,
    concluido: formAtendimento.concluido
  }
  const consultaAtendimento = atendimentoEditandoId
    ? supabase.from('atividades').update(dadosAtendimento).eq('id', atendimentoEditandoId)
    : supabase.from('atividades').insert([dadosAtendimento])
  const { error } = await consultaAtendimento

  if (error) {
    alert('Erro ao salvar atendimento: ' + error.message)
    setSalvandoAtendimento(false)
    return
  }

  setMensagemAtendimento(atendimentoEditandoId ? 'Atendimento atualizado com sucesso!' : 'Atendimento registrado com sucesso!')
  setAtendimentoEditandoId(null)
  setMostrarFormAtendimento(false)
  setSalvandoAtendimento(false)

  setFormAtendimento({
    empresa_id: '',
    tipo: 'Ligação',
    descricao: '',
    data_atividade: new Date().toISOString().slice(0, 10),
    proximo_retorno: '',
    concluido: false
  })

  await carregarDados()
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Atendimentos</h1>
          <p>Histórico de contatos e atividades comerciais.</p>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={() => { setAtendimentoEditandoId(null); setFormAtendimento({ empresa_id:'', tipo:'Ligação', descricao:'', data_atividade:new Date().toISOString().slice(0,10), proximo_retorno:'', concluido:false }); setMostrarFormAtendimento(true) }}
      >
        + Novo Atendimento
      </button>

      {mensagemAtendimento && (
        <p>{mensagemAtendimento}</p>
      )}

      {mostrarFormAtendimento && (
        <section className="panel">
          <form onSubmit={salvarAtendimento}>

            <label>Empresa</label>
            <select
              value={formAtendimento.empresa_id}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  empresa_id: e.target.value
                })
              }
              required
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>

            <label>Tipo de atendimento</label>
            <select
              value={formAtendimento.tipo}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  tipo: e.target.value
                })
              }
            >
              <option value="Ligação">Ligação</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Visita">Visita</option>
              <option value="E-mail">E-mail</option>
              <option value="Reunião">Reunião</option>
              <option value="Orçamento">Orçamento</option>
              <option value="Observação">Observação</option>
            </select>

            <label>Descrição</label>
            <textarea
              value={formAtendimento.descricao}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  descricao: e.target.value
                })
              }
              placeholder="Descreva o atendimento realizado..."
              required
            />

            <label>Data do atendimento</label>
            <input
              type="date"
              value={formAtendimento.data_atividade}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  data_atividade: e.target.value
                })
              }
            />

            <label>Próximo retorno</label>
            <input
              type="date"
              value={formAtendimento.proximo_retorno}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  proximo_retorno: e.target.value
                })
              }
            />

            <label>
              <input
                type="checkbox"
                checked={formAtendimento.concluido}
                onChange={(e) =>
                  setFormAtendimento({
                    ...formAtendimento,
                    concluido: e.target.checked
                  })
                }
              />
              Atendimento concluído
            </label>

            <div>
              <button
                type="submit"
                className="btn-primary"
                disabled={salvandoAtendimento}
              >
                {salvandoAtendimento ? 'Salvando...' : 'Salvar Atendimento'}
              </button>

              <button
                type="button"
                onClick={() => setMostrarFormAtendimento(false)}
              >
                Cancelar
              </button>
            </div>

          </form>
        </section>
      )}

      <section className="panel">
        {atividades.map((item) => (
          <div className="activity" key={item.id}>
            <div className="activity-icon"></div>

            <div>
              <b>{item.tipo || 'Atendimento'}</b>
              <span>{nomeEmpresa(item.empresa_id)}</span>
              <p>{item.descricao || 'Sem descrição.'}</p>

              {item.proximo_retorno && (
                <p>
                  Próximo retorno: {dataBR(item.proximo_retorno)}
                </p>
              )}
            </div>

            <small>{dataBR(item.data_atividade)}</small>
            <div className="actions">{linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade) && <a className="btn-whatsapp" href={linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade)} target="_blank" rel="noreferrer">WhatsApp</a>}<button type="button" className="btn-editar" onClick={() => editarAtendimento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirAtendimento(item.id)}>Excluir</button></div>
          </div>
        ))}

        {!atividades.length && (
          <div className="empty">
            Nenhum atendimento registrado. Os botões Editar e Excluir aparecerão em cada atendimento cadastrado.
          </div>
        )}
      </section>
    </>
  )
}
  function Agenda() {
    const [mostrarFormTarefa, setMostrarFormTarefa] = useState(() => !!sessionStorage.getItem('centraltruck_agendar_empresa') || !!localStorage.getItem('ct_rascunho_agenda'))
    const [salvandoTarefa, setSalvandoTarefa] = useState(false)
    const [mensagemTarefa, setMensagemTarefa] = useState('')
    const [lembrarNoCRM, setLembrarNoCRM] = useState(true)
    const [antecedencia, setAntecedencia] = useState('0')
    const [avisosAgenda, setAvisosAgenda] = useState([])
    const numeroLembrete = '31975255079'
    useEffect(() => {
      const verificar = () => {
        const agora = Date.now()
        const avisos = tarefas.filter(t => {
          if (t.status === 'Concluída' || !t.data_hora || localStorage.getItem('ct_lembrete_' + t.id) === 'nao') return false
          const prazo = new Date(t.data_hora).getTime() - Number(localStorage.getItem('ct_antecedencia_' + t.id) || 0) * 60000
          return prazo <= agora && agora - prazo < 86400000
        })
        setAvisosAgenda(avisos)
        avisos.forEach(t => {
          const chave = 'ct_aviso_exibido_' + t.id + '_' + t.data_hora
          if (!sessionStorage.getItem(chave) && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Central Truck — Lembrete', {body: t.titulo + ' • ' + (nomeEmpresa(t.empresa_id) || 'Contato')})
            sessionStorage.setItem(chave, 'sim')
          }
        })
      }
      verificar()
      const intervalo = setInterval(verificar, 60000)
      return () => clearInterval(intervalo)
    }, [tarefas])
    const whatsappParaMim = tarefa => {
      const telefone = numeroLembrete.replace(/\D/g, '')
      const destino = telefone.startsWith('55') ? telefone : '55' + telefone
      const mensagem = 'LEMBRETE CENTRAL TRUCK%0A' + encodeURIComponent('Cliente: ' + nomeEmpresa(tarefa.empresa_id) + '\nTarefa: ' + tarefa.titulo + '\nData: ' + dataBR(tarefa.data_hora) + '\n' + (tarefa.descricao || ''))
      return 'https://wa.me/' + destino + '?text=' + mensagem
    }

    const [tarefaEditandoId, setTarefaEditandoId] = useState(null)
    const [formTarefa, setFormTarefa] = useState(() => {
       try { const salvo = JSON.parse(localStorage.getItem('ct_rascunho_agenda') || 'null'); if (salvo && typeof salvo === 'object') return salvo } catch (_) {}
       return { empresa_id: '', cliente_avulso: '', titulo: '', descricao: '', data_hora: '', prioridade: 'Normal', status: 'Pendente' }
     })
     useEffect(() => {
       if (mostrarFormTarefa) localStorage.setItem('ct_rascunho_agenda', JSON.stringify(formTarefa))
     }, [formTarefa, mostrarFormTarefa])

    useEffect(() => {
      const id = sessionStorage.getItem('centraltruck_agendar_empresa')
      if (id) {
        setFormTarefa(anterior => ({ ...anterior, empresa_id: id, titulo: 'Retornar contato', status: 'Pendente' }))
        setMostrarFormTarefa(true)
        sessionStorage.removeItem('centraltruck_agendar_empresa')
      }
    }, [])

    function editarTarefa(item) {
      setFormTarefa({
        empresa_id: item.empresa_id || '',
        cliente_avulso: (item.descricao || '').match(/^Cliente não cadastrado: (.*?)(?:\n|$)/)?.[1] || '',
        titulo: item.titulo || '',
        descricao: (item.descricao || '').replace(/^Cliente não cadastrado: .*?(?:\n|$)/, ''),
        data_hora: item.data_hora ? String(item.data_hora).slice(0,16) : '',
        prioridade: item.prioridade || 'Normal',
        status: item.status || 'Pendente'
      })
      setTarefaEditandoId(item.id)
      setLembrarNoCRM(localStorage.getItem('ct_lembrete_' + item.id) !== 'nao')
      setAntecedencia(localStorage.getItem('ct_antecedencia_' + item.id) || '0')
      setMostrarFormTarefa(true)
    }

    async function excluirTarefa(id) {
      const confirmar = window.confirm('Tem certeza que deseja excluir esta tarefa?')
      if (!confirmar) return

      const { error } = await supabase.from('tarefas').delete().eq('id', id)
      if (error) {
        alert('Erro ao excluir tarefa: ' + error.message)
        return
      }
      await carregarDados()
    }

    async function salvarTarefa(e) {
      e.preventDefault()

      if (!formTarefa.titulo.trim() || !formTarefa.data_hora) {
        alert('Informe o título e a data/hora da tarefa.')
        return
      }

      setSalvandoTarefa(true)
      setMensagemTarefa('')

      const dadosTarefa = {
        empresa_id: formTarefa.empresa_id ? Number(formTarefa.empresa_id) : null,
        titulo: formTarefa.titulo.trim(),
        descricao: [!formTarefa.empresa_id && formTarefa.cliente_avulso.trim() ? 'Cliente não cadastrado: ' + formTarefa.cliente_avulso.trim() : '', formTarefa.descricao.trim()].filter(Boolean).join('\n') || null,
        data_hora: formTarefa.data_hora,
        prioridade: formTarefa.prioridade,
        status: formTarefa.status,
      }
      const consultaTarefa = tarefaEditandoId
        ? supabase.from('tarefas').update(dadosTarefa).eq('id', tarefaEditandoId)
        : supabase.from('tarefas').insert([dadosTarefa])
      const { error } = await consultaTarefa

      if (error) {
        alert('Erro ao salvar tarefa: ' + error.message)
        setSalvandoTarefa(false)
        return
      }

      const idSalvo = tarefaEditandoId
      if (idSalvo) { localStorage.setItem('ct_lembrete_' + idSalvo, lembrarNoCRM ? 'sim' : 'nao'); localStorage.setItem('ct_antecedencia_' + idSalvo, antecedencia) }
      localStorage.removeItem('ct_rascunho_agenda')
       setMensagemTarefa(tarefaEditandoId ? 'Tarefa atualizada com sucesso!' : 'Tarefa cadastrada com sucesso!')
      setTarefaEditandoId(null)
      setMostrarFormTarefa(false)
      setSalvandoTarefa(false)
      setFormTarefa({
        empresa_id: '',
        titulo: '',
        descricao: '',
        data_hora: '',
        prioridade: 'Normal',
        status: 'Pendente',
      })
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Agenda</h1>
            <p>Retornos, ligações, visitas e tarefas comerciais. {tarefas.length} tarefa(s) sincronizada(s) com o Dashboard.</p>
          </div>
        </div>

        <button type="button" className="btn-secondary" onClick={carregarDados} style={{marginRight:12}}>↻ Atualizar agendamentos</button>
        {erro && <p role="alert">Erro ao carregar agenda: {erro}</p>}
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setTarefaEditandoId(null); setFormTarefa({ empresa_id:'', cliente_avulso:'', titulo:'', descricao:'', data_hora:'', prioridade:'Normal', status:'Pendente' }); setMostrarFormTarefa(true) }}
        >
          + Nova Tarefa
        </button>

        {mostrarFormTarefa && (
          <section className="panel form-panel">
            <form onSubmit={salvarTarefa}>
              <div className="form-grid">
                <label>
                  Empresa
                  <select
                    value={formTarefa.empresa_id}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, empresa_id: e.target.value })
                    }
                  >
                    <option value="">Sem empresa vinculada</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome_fantasia || empresa.nome}
                      </option>
                    ))}
                  </select>
                </label>

                {!formTarefa.empresa_id && (
                  <label>
                    Nome do cliente não cadastrado
                    <input
                      type="text"
                      value={formTarefa.cliente_avulso || ''}
                      onChange={(e) => setFormTarefa({ ...formTarefa, cliente_avulso: e.target.value })}
                      placeholder="Digite o nome do cliente ou empresa"
                    />
                  </label>
                )}

                <label>
                  Título
                  <input
                    type="text"
                    value={formTarefa.titulo}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, titulo: e.target.value })
                    }
                    placeholder="Ex.: Retornar para cliente"
                    required
                  />
                </label>

                <label>
                  Data e hora
                  <input
                    type="datetime-local"
                    value={formTarefa.data_hora}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, data_hora: e.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Prioridade
                  <select
                    value={formTarefa.prioridade}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, prioridade: e.target.value })
                    }
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={formTarefa.status}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, status: e.target.value })
                    }
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </label>

                <label className="full">
                  Descrição
                  <textarea
                    value={formTarefa.descricao}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, descricao: e.target.value })
                    }
                    placeholder="Observações sobre a tarefa..."
                  />
                </label>
              </div>

              <div style={{margin:'12px 0',display:'flex',gap:'14px',flexWrap:'wrap',alignItems:'center'}}><label><input type="checkbox" checked={lembrarNoCRM} onChange={e=>setLembrarNoCRM(e.target.checked)} /> Lembrar no CRM</label><label>Antecedência <select value={antecedencia} onChange={e=>setAntecedencia(e.target.value)}><option value="0">Na hora</option><option value="15">15 minutos</option><option value="60">1 hora</option><option value="1440">1 dia</option></select></label><button type="button" onClick={() => { if ('Notification' in window) Notification.requestPermission(); else alert('Seu navegador não suporta notificações.'); }}>Ativar notificações do navegador</button></div><p style={{fontSize:'12px'}}>Avisos automáticos funcionam enquanto o CRM estiver aberto. O envio pelo WhatsApp exige clicar em enviar.</p>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={salvandoTarefa}>
                  {salvandoTarefa ? 'Salvando...' : 'Salvar Tarefa'}
                </button>
                <button type="button" onClick={() => setMostrarFormTarefa(false)}>
                  Cancelar
                </button>
              </div>

              {mensagemTarefa && <p>{mensagemTarefa}</p>}
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-heading"><div><h2>Agendamentos cadastrados ({tarefas.length})</h2><p>Todos os contatos salvos na Agenda.</p></div></div>
          {tarefas.map((tarefa) => (
            <div className="activity" key={tarefa.id}>
              <div className="activity-icon">✓</div>
              <div>
                <b>{tarefa.titulo}</b>
                <span>{nomeEmpresa(tarefa.empresa_id)}</span>
                <p>{tarefa.descricao || 'Sem descrição.'}</p>
              </div>
              <div className="task-date">
                <b>{dataBR(tarefa.data_hora)}</b>
                <span>{tarefa.status}</span>
                <div className="actions">
                  <a className="btn-whatsapp" href={whatsappParaMim(tarefa)} target="_blank" rel="noreferrer">🔔 Lembrete no meu WhatsApp</a>
                  <button type="button" className="btn-editar" onClick={() => editarTarefa(tarefa)}>Editar</button>
                  <button type="button" className="btn-excluir" onClick={() => excluirTarefa(tarefa.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
          {!tarefas.length && (
            <div className="empty">Nenhuma tarefa cadastrada.</div>
          )}
        </section>
      </>
    )
  }

  function Orcamentos() {
    const chaveRascunho = 'centraltruck_orcamento_rascunho_' + (session?.user?.id || 'local')
    const [mostrarForm, setMostrarForm] = useState(() => {
      try { return Boolean(JSON.parse(localStorage.getItem(chaveRascunho))?.aberto) } catch { return false }
    })
    const [salvando, setSalvando] = useState(false)
    const [filtroMes, setFiltroMes] = useState('')
    const [filtroInicio, setFiltroInicio] = useState('')
    const [filtroFim, setFiltroFim] = useState('')
    const orcamentosFiltrados = orcamentos.filter(item => {
      if (!item.data_envio) return !filtroMes && !filtroInicio && !filtroFim
      const data = String(item.data_envio).slice(0,10)
      if (filtroMes && data.slice(0,7) !== filtroMes) return false
      if (filtroInicio && data < filtroInicio) return false
      if (filtroFim && data > filtroFim) return false
      return true
    })
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(() => {
      try { return JSON.parse(localStorage.getItem(chaveRascunho))?.editandoId ?? null } catch { return null }
    })
    const [osAberta, setOsAberta] = useState(null)
    const [osArquivos, setOsArquivos] = useState([])
    const [osErro, setOsErro] = useState('')
    const [osEnviando, setOsEnviando] = useState(false)
    async function carregarOS(item) {
      setOsAberta(item)
      setOsErro('')
      const {data,error} = await supabase.storage.from('orcamento-anexos').list(String(item.id))
      if(error){setOsErro('Armazenamento indisponível: '+error.message);setOsArquivos([]);return}
      setOsArquivos((data||[]).filter(x=>x.name!=='.emptyFolderPlaceholder'))
    }
    async function anexarOS(e) {
      const arquivo=e.target.files?.[0]
      e.target.value=''
      if(!arquivo||!osAberta)return
      if(arquivo.size>10485760){setOsErro('Limite de 10 MB por arquivo.');return}
      if(!/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(arquivo.name)){setOsErro('Selecione PDF, Word ou imagem.');return}
      setOsEnviando(true)
      setOsErro('')
      try {
        const nome=Date.now()+'-'+arquivo.name.replace(/[^a-zA-Z0-9._-]/g,'_')
        const {error}=await supabase.storage.from('orcamento-anexos').upload(String(osAberta.id)+'/'+nome,arquivo)
        if(error)throw error
        await carregarOS(osAberta)
      }catch(error){setOsErro('Erro ao salvar OS: '+error.message)}
      finally{setOsEnviando(false)}
    }
    async function visualizarOS(nome) {
      const {data,error}=await supabase.storage.from('orcamento-anexos').createSignedUrl(String(osAberta.id)+'/'+nome,120)
      if(error){setOsErro(error.message);return}
      window.open(data.signedUrl,'_blank','noopener,noreferrer')
    }
    const [form, setForm] = useState(() => {
      let anterior = null
      try { anterior = JSON.parse(localStorage.getItem(chaveRascunho))?.form } catch {}
      return anterior || {
      empresa_id: '',
      oportunidade_id: '',
      numero_orcamento: '',
      descricao: '',
      valor: '',
      status: 'Enviado',
      data_envio: new Date().toISOString().slice(0, 10),
      validade: '',
      observacoes: '',
      }
    })
    useEffect(() => {
      if (mostrarForm) localStorage.setItem(chaveRascunho, JSON.stringify({aberto:true,editandoId:orcamentoEditandoId,form}))
    }, [mostrarForm, orcamentoEditandoId, form, chaveRascunho])

    async function salvarOrcamento(e) {
      e.preventDefault()
      if (!form.empresa_id || !form.descricao) {
        alert('Selecione a empresa e informe a descrição.')
        return
      }
      setSalvando(true)
      const dadosOrcamento = {
        empresa_id: Number(form.empresa_id),
        oportunidade_id: form.oportunidade_id ? Number(form.oportunidade_id) : null,
        numero_orcamento: form.numero_orcamento.trim() || null,
        descricao: form.descricao.trim(),
        valor: form.valor ? Number(form.valor) : null,
        status: form.status,
        data_envio: form.data_envio || null,
        validade: form.validade || null,
        observacoes: form.observacoes.trim() || null,
      }
      const consultaOrcamento = orcamentoEditandoId
        ? supabase.from('orcamentos').update(dadosOrcamento).eq('id', orcamentoEditandoId)
        : supabase.from('orcamentos').insert([dadosOrcamento])
      const { error } = await consultaOrcamento
      if (error) {
        alert('Erro ao salvar orçamento: ' + error.message)
        setSalvando(false)
        return
      }
      setForm({
        empresa_id: '', oportunidade_id: '', numero_orcamento: '', descricao: '',
        valor: '', status: 'Enviado', data_envio: new Date().toISOString().slice(0, 10),
        validade: '', observacoes: '',
      })
      localStorage.removeItem(chaveRascunho)
      setOrcamentoEditandoId(null)
      setMostrarForm(false)
      setSalvando(false)
      await carregarDados()
    }

    function editarOrcamento(item) {
      setForm({
        empresa_id: item.empresa_id || '',
        oportunidade_id: item.oportunidade_id || '',
        numero_orcamento: item.numero_orcamento || '',
        descricao: item.descricao || '',
        valor: item.valor ?? '',
        status: item.status || 'Enviado',
        data_envio: item.data_envio ? String(item.data_envio).slice(0,10) : '',
        validade: item.validade ? String(item.validade).slice(0,10) : '',
        observacoes: item.observacoes || ''
      })
      setOrcamentoEditandoId(item.id)
      setMostrarForm(true)
    }

    async function excluirOrcamento(id) {
      if (!window.confirm('Excluir este orçamento?')) return
      const { error } = await supabase.from('orcamentos').delete().eq('id', id)
      if (error) return alert('Erro ao excluir orçamento: ' + error.message)
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Orçamentos</h1>
            <p>Controle dos orçamentos enviados aos clientes.</p>
          </div>
          <button className="primary" onClick={() => {
            if (mostrarForm) { localStorage.removeItem(chaveRascunho); setMostrarForm(false); setOrcamentoEditandoId(null); return }
            setOrcamentoEditandoId(null)
            setForm({ empresa_id:'', oportunidade_id:'', numero_orcamento:'', descricao:'', valor:'', status:'Enviado', data_envio:new Date().toISOString().slice(0,10), validade:'', observacoes:'' })
            setMostrarForm(true)
          }}>
            {mostrarForm ? 'Cancelar' : '+ Novo Orçamento'}
          </button>
        </div>

        {mostrarForm && (
          <section className="panel">
            <h2>{orcamentoEditandoId ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
            <form onSubmit={salvarOrcamento}>
              <div className="form-grid">
                <label>Empresa *
                  <select value={form.empresa_id} onChange={(e) => setForm({...form, empresa_id:e.target.value})} required>
                    <option value="">Selecione</option>
                    {empresas.map((x)=><option key={x.id} value={x.id}>{x.nome_fantasia || x.nome}</option>)}
                  </select>
                </label>
                <label>Oportunidade
                  <select value={form.oportunidade_id} onChange={(e) => setForm({...form, oportunidade_id:e.target.value})}>
                    <option value="">Sem vínculo</option>
                    {oportunidades.filter((x)=>!form.empresa_id || String(x.empresa_id)===String(form.empresa_id)).map((x)=><option key={x.id} value={x.id}>{x.titulo}</option>)}
                  </select>
                </label>
                <label>Número
                  <input value={form.numero_orcamento} onChange={(e)=>setForm({...form,numero_orcamento:e.target.value})} placeholder="Ex.: ORC-001"/>
                </label>
                <label>Valor (R$)
                  <input type="number" min="0" step="0.01" value={form.valor} onChange={(e)=>setForm({...form,valor:e.target.value})}/>
                </label>
                <label>Status
                  <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                    {['Rascunho','Enviado','Visualizado','Em negociação','Aprovado','Recusado','Finalizado'].map((x)=><option key={x}>{x}</option>)}
                  </select>
                </label>
                <label>Data de envio
                  <input type="date" value={form.data_envio} onChange={(e)=>setForm({...form,data_envio:e.target.value})}/>
                </label>
                <label>Validade
                  <input type="date" value={form.validade} onChange={(e)=>setForm({...form,validade:e.target.value})}/>
                </label>
                <label className="full">Descrição *
                  <textarea value={form.descricao} onChange={(e)=>setForm({...form,descricao:e.target.value})} required/>
                </label>
                <label className="full">Observações
                  <textarea value={form.observacoes} onChange={(e)=>setForm({...form,observacoes:e.target.value})}/>
                </label>
              </div>
              <div className="form-actions">
                <button className="primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar Orçamento'}</button>
              </div>
            </form>
          </section>
        )}

        {osAberta && <section className="panel">
          <h2>Anexar OS — Orçamento {osAberta.numero_orcamento || osAberta.id}</h2>
          <p>Selecione PDF, Word ou imagem (máximo 10 MB).</p>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={osEnviando} onChange={anexarOS}/>
          {osEnviando && <p>Enviando...</p>}
          {osErro && <p role="alert" style={{color:'#ff8585'}}>{osErro}</p>}
          {osArquivos.map(a=><div key={a.name} style={{marginTop:10}}>
            <span>{a.name} </span>
            <button type="button" onClick={()=>visualizarOS(a.name)}>Abrir / baixar</button>
          </div>)}
          <button type="button" onClick={()=>setOsAberta(null)}>Fechar</button>
        </section>}
        <section className="panel" style={{marginBottom:16}}>
          <h2>Filtrar orçamentos por mês e data</h2>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}>
            <label>Mês <input type="month" value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/></label>
            <label>Data inicial <input type="date" value={filtroInicio} onChange={e=>setFiltroInicio(e.target.value)}/></label>
            <label>Data final <input type="date" value={filtroFim} onChange={e=>setFiltroFim(e.target.value)}/></label>
            <button type="button" onClick={()=>{setFiltroMes('');setFiltroInicio('');setFiltroFim('')}}>Limpar filtros</button>
          </div>
          <p>{orcamentosFiltrados.length} orçamento(s) encontrado(s)</p>
        </section>
        <section className="panel table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Empresa</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Envio</th><th>Ações</th></tr></thead>
            <tbody>
              {orcamentosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.numero_orcamento || `#${item.id}`}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.descricao || '—'}</td>
                  <td>{dinheiro(item.valor)}</td>
                  <td><span className="status">{item.status}</span></td>
                  <td>{dataBR(item.data_envio)}</td>
                  <td><div className="actions"><button type="button" onClick={() => carregarOS(item)}>Anexar OS</button><button type="button" className="btn-editar" onClick={() => editarOrcamento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={()=>excluirOrcamento(item.id)}>Excluir</button></div></td>
                </tr>
              ))}
              {!orcamentos.length && <tr><td colSpan="7" className="empty">Nenhum orçamento cadastrado.</td></tr>}
            </tbody>
          </table>
        </section>
      </>
    )
  }

  function Relatorios() {
    const [arquivoLeads, setArquivoLeads] = useState(null)
    const [importandoLeads, setImportandoLeads] = useState(false)
    const [msgImportacao, setMsgImportacao] = useState('')

    async function baixarModeloLeads() {
      const XLSX = await import('xlsx')
      const dados = [
        ['CENTRAL TRUCK SERVICE'],
        ['LISTA DE LEADS - IMPORTACAO PARA O CRM'],
        [],
        ['Nome da empresa','Nome fantasia','CNPJ','Segmento','Classificacao','Status','Cidade','Estado','Telefone','WhatsApp','E-mail','Site','Observacoes'],
        ['Transportadora Exemplo','Exemplo Logistica','','Transportadora','A','Lead novo','Contagem','MG','31999999999','31999999999','contato@exemplo.com.br','','Cliente para prospeccao']
      ]
      const ws = XLSX.utils.aoa_to_sheet(dados)
      ws['!merges'] = [XLSX.utils.decode_range('A1:M1'), XLSX.utils.decode_range('A2:M2')]
      ws['!cols'] = [{wch:28},{wch:26},{wch:20},{wch:20},{wch:15},{wch:20},{wch:20},{wch:10},{wch:18},{wch:18},{wch:30},{wch:28},{wch:38}]
      ws['!rows'] = [{hpt:34},{hpt:25},{hpt:8},{hpt:28}]
      ws['!autofilter'] = { ref: 'A4:M5' }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Leads Central Truck')
      XLSX.writeFile(wb, 'Modelo_Leads_Central_Truck.xlsx')
    }

    function separarCSV(linha) {
      const valores = []
      let atual = ''
      let aspas = false
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i]
        if (ch === '"') {
          if (aspas && linha[i + 1] === '"') { atual += '"'; i++ } else aspas = !aspas
        } else if ((ch === ',' || ch === ';') && !aspas) {
          valores.push(atual.trim()); atual = ''
        } else atual += ch
      }
      valores.push(atual.trim())
      return valores
    }

    async function importarLeads() {
      if (!arquivoLeads) { setMsgImportacao('Selecione um arquivo para continuar.'); return }
      const extensao = (arquivoLeads.name.split('.').pop() || '').toLowerCase()
      if (extensao !== 'csv') {
        setMsgImportacao('Arquivo recebido sem alterar o original. PDF, JPG/PNG e Word podem ser enviados e mantidos no formato original; para cadastrar clientes automaticamente no Funil, use CSV.')
        return
      }
      setImportandoLeads(true)
      setMsgImportacao('')
      try {
        const texto = await arquivoLeads.text()
        const linhas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim())
        if (linhas.length < 2) throw new Error('O arquivo está vazio ou sem clientes.')
        const colunas = separarCSV(linhas[0]).map((x) => x.toLowerCase().trim())
        const obrigatoria = colunas.indexOf('nome')
        if (obrigatoria < 0) throw new Error('A coluna "nome" é obrigatória. Use o modelo disponível.')
        let importados = 0
        let falhas = 0
        for (const linha of linhas.slice(1)) {
          const valores = separarCSV(linha)
          const registro = {}
          colunas.forEach((col, idx) => { registro[col] = (valores[idx] || '').trim() })
          if (!registro.nome) { falhas++; continue }
          const status = registro.status || 'Lead novo'
          const empresa = {
            nome: registro.nome,
            nome_fantasia: registro.nome_fantasia || null,
            cnpj: registro.cnpj || null,
            segmento: registro.segmento || null,
            classificacao: ['A','B','C'].includes((registro.classificacao || '').toUpperCase()) ? registro.classificacao.toUpperCase() : 'B',
            status,
            cidade: registro.cidade || null,
            estado: registro.estado || 'MG',
            telefone: registro.telefone || null,
            whatsapp: registro.whatsapp || null,
            email: registro.email || null,
            site: registro.site || null,
            observacoes: registro.observacoes || null
          }
          const { data: criada, error: erroEmpresa } = await supabase.from('empresas').insert([empresa]).select('id').single()
          if (erroEmpresa || !criada?.id) { falhas++; continue }
          importados++
        }
        await carregarDados()
        setArquivoLeads(null)
        setMsgImportacao(importados + ' cliente(s) importado(s) para Empresas/Leads. Oportunidades só serão criadas quando cadastradas explicitamente.' + (falhas ? ' ' + falhas + ' linha(s) com erro.' : ''))
      } catch (e) {
        setMsgImportacao('Erro na importação: ' + e.message)
      } finally {
        setImportandoLeads(false)
      }
    }

    return (
      <>
        <div className="page-title"><div><h1>Relatórios</h1><p>Indicadores comerciais da Central Truck.</p></div></div>
        <section className="cards">
          <Card titulo="Leads" valor={empresas.length} />
          <Card titulo="Contatos" valor={contatos.length} />
          <Card titulo="Oportunidades" valor={oportunidades.length} />
          <Card titulo="Vendas" valor={vendas.length} />
          <Card titulo="Conversão" valor={`${conversao}%`} />
          <Card titulo="Valor Vendido" valor={dinheiro(valorVendido)} />
        </section>
        <section className="panel lead-import-panel">
          <div className="panel-heading">
            <div><h2>Enviar relatórios e importar clientes</h2><p>Selecione PDF, JPG, PNG, Word ou CSV. O arquivo original é mantido sem alteração; listas em CSV podem ser organizadas automaticamente em Empresas/Leads e no Funil Comercial.</p></div>
          </div>
          <div className="lead-import-actions">
            <button type="button" className="btn-secondary" onClick={baixarModeloLeads}>Baixar modelo Excel</button>
            <label className="file-import-box">
              <span>{arquivoLeads ? arquivoLeads.name : 'Selecionar lista de clientes (.CSV)'}</span>
              <input type="file" accept=".csv,text/csv" onChange={(e)=>{setArquivoLeads(e.target.files?.[0] || null);setMsgImportacao('')}} />
            </label>
            <button type="button" className="primary" disabled={importandoLeads || !arquivoLeads} onClick={importarLeads}>{importandoLeads ? 'Importando...' : 'Importar clientes para o Funil'}</button>
          </div>
          <p className="import-help"><b>Importação de clientes:</b> use CSV para cadastrar automaticamente Empresas/Leads e criar as oportunidades no Funil. Colunas aceitas: nome, nome_fantasia, CNPJ, segmento, classificação A/B/C, status, cidade, estado, telefone, WhatsApp, e-mail, site e observações.</p>
          <div className="import-message"><b>Relatórios PDF, JPG, PNG e Word:</b> são documentos para consulta e não são convertidos automaticamente em clientes, evitando perda de formatação ou cadastro incorreto. Para importar uma lista desses formatos, converta-a primeiro para CSV usando o modelo acima.</div>
          {msgImportacao && <div className="import-message">{msgImportacao}</div>}
        </section>
      </>
    )
  }


  function ImportarContatos() {
    const [arquivo, setArquivo] = useState(null)
    const [importando, setImportando] = useState(false)
    const [mensagem, setMensagem] = useState('')

    const normalizar = (v='') => String(v ?? '').trim()
    const chave = (v='') => normalizar(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')

    function valorCampo(registro, nomes) {
      for (const nome of nomes) {
        const k = Object.keys(registro).find(x => chave(x) === chave(nome))
        if (k && normalizar(registro[k])) return normalizar(registro[k])
      }
      return ''
    }

    async function lerArquivo(file) {
      const ext=(file.name.split('.').pop()||'').toLowerCase()
      if (['xlsx','xls','xlsm','xlsb','ods','csv','txt'].includes(ext)) {
        const XLSX=await import('xlsx')
        const buffer=await file.arrayBuffer()
        const wb=XLSX.read(buffer,{type:'array'})
        const aliases=['empresa','nome da empresa','razao social','nome fantasia','nome','cliente','oficina','estabelecimento','organizacao','company','organization','contato','nome do contato','telefone','celular','whatsapp','email','e-mail','endereco','cidade','cnpj','responsavel']
        const saida=[]
        for(const nomeAba of wb.SheetNames){
          const matriz=XLSX.utils.sheet_to_json(wb.Sheets[nomeAba],{header:1,defval:'',raw:false,blankrows:false})
          if(!matriz.length) continue
          const pontuacao=linha=>(Array.isArray(linha)?linha:[]).filter(c=>aliases.some(a=>chave(c)===chave(a)||chave(c).startsWith(chave(a))&&chave(a).length>4)).length
          const candidatos=matriz.slice(0,30).map((linha,i)=>({i,p:pontuacao(linha)})).sort((a,b)=>b.p-a.p)
          const indice=candidatos[0]?.p>=2?candidatos[0].i:-1
          if(indice<0) continue
          const titulos=matriz[indice].map((c,i)=>normalizar(c)||'Coluna '+(i+1))
          const registros=matriz.slice(indice+1).filter(linha=>Array.isArray(linha)&&linha.some(c=>normalizar(c))).map(linha=>Object.fromEntries(titulos.map((titulo,i)=>[titulo,linha[i]??''])))
          saida.push(...registros)
        }
        if(!saida.length) throw new Error('Não identifiquei automaticamente os campos desta planilha. Envie uma planilha com títulos como Nome, Empresa, Telefone ou E-mail.')
        return saida
      }
      if (['json'].includes(ext)) {
        const obj=JSON.parse(await file.text())
        return Array.isArray(obj)?obj:(obj.contatos||obj.clientes||obj.empresas||[])
      }
      if (['vcf','vcard'].includes(ext)) {
        const texto=await file.text()
        return texto.split(/BEGIN:VCARD/i).slice(1).map(bloco=>{
          const pega=(re)=>((bloco.match(re)||[])[1]||'').trim()
          return {nome:pega(/\nFN[^:]*:([^\r\n]+)/i),telefone:pega(/\nTEL[^:]*:([^\r\n]+)/i),email:pega(/\nEMAIL[^:]*:([^\r\n]+)/i),empresa:pega(/\nORG[^:]*:([^\r\n]+)/i)}
        })
      }
      throw new Error('Formato não compatível para importação automática.')
    }

    async function importar() {
      if(!arquivo){setMensagem('Selecione um arquivo.');return}
      setImportando(true); setMensagem('')
      try{
        const linhas=await lerArquivo(arquivo)
        if(!linhas.length) throw new Error('Nenhum contato encontrado no arquivo.')
        let ok=0, erros=0
        for(const r of linhas){
          const nomeEmpresa=valorCampo(r,['nome da empresa','empresa','razao social','razão social','nome fantasia','cliente','oficina','estabelecimento','organização','nome','company','organization','org','nome do contato','contato'])
          const contato=valorCampo(r,['pessoa de contato','contato','responsavel','responsável','nome do contato','nome decisor / contato','contact','contact name'])
          const camposTelefone = Object.keys(r).filter(k => /^(telefone|fone|tel|celular|whatsapp|whats|zap|phone|mobile|contatotelefonico|numero)/.test(chave(k)))
          const telefone=valorCampo(r,['telefone','telefone comercial','fone','phone','celular','mobile','telefone 1','telefone principal','telefone 2','telefone de contato','contato telefonico','fone/whatsapp','telefone/whatsapp','tel','numero de telefone']) || camposTelefone.map(k => normalizar(r[k])).find(Boolean) || ''
          const whatsapp=valorCampo(r,['whatsapp','telefone direto / whatsapp','telefone direto whatsapp','whats app','zap','celular whatsapp','telefone whatsapp']) || telefone
          const email=valorCampo(r,['email','e-mail','e-mail corporativo / público','email corporativo publico','mail','correio eletronico'])
          const cidade=valorCampo(r,['cidade','city'])
          const estado=valorCampo(r,['estado','uf','state']) || 'MG'
          const segmento=valorCampo(r,['segmento','categoria','ramo'])
          const status=valorCampo(r,['status','etapa']) || 'Lead novo'
          const cnpj=valorCampo(r,['cnpj','cpf/cnpj','documento'])
          const observacoes=[valorCampo(r,['observacoes','observações','obs','notes']),...['Cargo / área decisora','Frota / operação','Tecnologias / equipamentos','Prioridade','LinkedIn decisor','Funcionários estimados'].map(c=>valorCampo(r,[c])?c+': '+valorCampo(r,[c]):'')].filter(Boolean).join(' | ')
          if(!nomeEmpresa){erros++;continue}
          const dados={nome:nomeEmpresa,nome_fantasia:null,cnpj:cnpj||null,segmento:segmento||null,status,cidade:cidade||null,estado,telefone:telefone||null,whatsapp:whatsapp||null,email:email||null,observacoes:[contato?'Contato: '+contato:'',observacoes].filter(Boolean).join(' | ')||null}
          const {error}=await supabase.from('empresas').insert([dados])
          if(error) { erros++; console.error('Falha ao importar empresa:',nomeEmpresa,error); }
          else ok++
        }
        await carregarDados()
        if(ok>0) {
          setPagina('empresas')
          window.alert(ok+' empresa(s) salva(s) em Empresas / Leads.'+(erros?' '+erros+' registro(s) falharam; confira o console para detalhes.':''))
        } else {
          setMensagem('Nenhuma empresa foi salva. '+erros+' registro(s) falharam. Confira os nomes das empresas e as permissões de gravação no Supabase.')
        }
      }catch(e){setMensagem('Erro: '+e.message)}
      finally{setImportando(false)}
    }

    return <>
      <div className="page-title"><div><h1>Importar Contatos</h1><p>Importe listas de contatos e clientes diretamente para o CRM.</p></div></div>
      <section className="panel lead-import-panel">
        <h2>Selecionar arquivo</h2>
        <p>Compatível com planilhas Excel antigas e atuais, CSV, ODS, TXT, JSON e contatos VCF/vCard.</p>
        <div className="lead-import-actions">
          <label className="file-import-box">
            <span>{arquivo?arquivo.name:'Selecionar arquivo de contatos'}</span>
            <input type="file" accept=".xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.txt,.json,.vcf,.vcard" onChange={e=>{setArquivo(e.target.files?.[0]||null);setMensagem('')}} />
          </label>
          <button type="button" className="primary" disabled={!arquivo||importando} onClick={importar}>{importando?'Importando...':'Importar para o CRM'}</button>
        </div>
        <p className="import-help"><b>Campos reconhecidos automaticamente:</b> empresa, pessoa de contato, CNPJ, segmento, status, cidade, estado, telefone, WhatsApp, e-mail e observações. Os títulos podem variar, por exemplo: Empresa, Razão Social, Contato, Responsável, Fone, Celular, UF ou E-mail.</p>
        <div className="import-message"><b>PDF, JPG/PNG e Word:</b> podem ser mantidos em Relatórios, mas não são convertidos automaticamente em contatos para evitar cadastros incorretos.</div>
        {mensagem&&<div className="import-message">{mensagem}</div>}
      </section>
    </>
  }

  function Configuracoes() {
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Configurações</h1>
            <p>Informações gerais do CRM.</p>
          </div>
        </div>

        <section className="panel config">
          <h2>Central Truck Service</h2>
          <p><b>Sistema:</b> Central Truck CRM</p>
          <p><b>Banco de dados:</b> Supabase</p>
          <p><b>Hospedagem:</b> GitHub Pages</p>
          <p><b>Moeda:</b> Real brasileiro (BRL)</p>
          <p><b>Idioma:</b> Português do Brasil</p>

          <button className="primary" onClick={carregarDados}>
            Testar conexão com banco
          </button>
        </section>
      </>
    )
  }


  function OrdensServico() {
    const vazio = {numero_os:'',empresa_id:'',servicos:'',pecas:'',produto:'',valor_produto:'',valor:'',forma_pagamento:''}
    const [registros,setRegistros] = useState([])
    const [itensCatalogo,setItensCatalogo] = useState([])
    const [itemSelecionado,setItemSelecionado] = useState('')
    const [quantidadeSelecionada,setQuantidadeSelecionada] = useState('1')
    const [busca,setBusca] = useState(() => localStorage.getItem('centraltruck_os_busca') || '')
    const [filtroMesOS,setFiltroMesOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_mes') || '')
    const [filtroNumeroOS,setFiltroNumeroOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_numero') || '')
    const [form,setForm] = useState(() => { try { return {...vazio,...JSON.parse(localStorage.getItem('centraltruck_os_rascunho') || '{}')} } catch { return vazio } })
    const [editando,setEditando] = useState(() => localStorage.getItem('centraltruck_os_editando') || null)
    const [mensagem,setMensagem] = useState('')
    const [salvando,setSalvando] = useState(false)
    const [mostrarBusca,setMostrarBusca] = useState(false)
    const [carregandoOS,setCarregandoOS] = useState(false)
    useEffect(() => { localStorage.setItem('centraltruck_os_rascunho',JSON.stringify(form)) },[form])
    useEffect(() => { localStorage.setItem('centraltruck_os_busca',busca) },[busca])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_mes',filtroMesOS) },[filtroMesOS])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_numero',filtroNumeroOS) },[filtroNumeroOS])
    useEffect(() => { if(editando) localStorage.setItem('centraltruck_os_editando',editando); else localStorage.removeItem('centraltruck_os_editando') },[editando])
    const registrosFiltrados = registros.filter(item => (!filtroMesOS || String(item.criado_em || '').slice(0,7) === filtroMesOS) && (!filtroNumeroOS || normalizarBusca(item.numero_os).includes(normalizarBusca(filtroNumeroOS.trim()))))
    const selecionada = empresas.find(e=>String(e.id)===String(form.empresa_id))
    const resultados = empresas.filter(e=>normalizarBusca([e.nome_fantasia,e.razao_social,e.nome,e.cnpj,e.telefone,e.whatsapp].join(' ')).includes(normalizarBusca(busca))).slice(0,30)
    async function atualizarOS() {
      setCarregandoOS(true)
      const {data,error}=await supabase.from('ordens_servico').select('*').order('criado_em',{ascending:false})
      setCarregandoOS(false)
      if(error) {setMensagem('Não foi possível consultar as OS: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{atualizarOS()},[])
    useEffect(()=>{supabase.from('catalogo_itens').select('*').order('nome',{ascending:true}).then(({data,error})=>{if(!error)setItensCatalogo(data||[])})},[])
    function adicionarItemCatalogo() {
      const item=itensCatalogo.find(i=>String(i.id)===String(itemSelecionado))
      if(!item){setMensagem('Selecione um produto ou serviço cadastrado.');return}
      const qtd=Math.max(1,Math.floor(Number(quantidadeSelecionada)||1))
      const subtotal=(Number(item.preco)||0)*qtd
      const linha=qtd+' x '+item.nome+' — '+dinheiro(subtotal)
      setForm(v=>item.tipo==='Serviço'
        ?{...v,servicos:[v.servicos,linha].filter(Boolean).join('\n')}
        :{...v,pecas:[v.pecas,linha].filter(Boolean).join('\n'),produto:v.produto||item.nome,valor_produto:(Number(String(v.valor_produto).replace(',','.'))||0)+subtotal})
      setItemSelecionado('');setQuantidadeSelecionada('1');setMensagem('Item incluído. Confira o valor total antes de salvar.')
    }
    function escolherEmpresa(e) {
      setForm(v=>({...v,empresa_id:String(e.id)}))
      setBusca(e.nome_fantasia||e.razao_social||e.nome||'')
      setMostrarBusca(false)
    }
    async function salvar(e) {
      e.preventDefault()
      if(!form.empresa_id) {setMensagem('Selecione um cliente cadastrado na busca.');return}
      setSalvando(true);setMensagem('')
      const payload={numero_os:form.numero_os.trim(),empresa_id:form.empresa_id,servicos:form.servicos,pecas:form.pecas,produto:form.produto,valor_produto:Number(String(form.valor_produto).replace(',','.'))||0,valor:Number(String(form.valor).replace(',','.'))||0,forma_pagamento:form.forma_pagamento}
      const consulta=editando
        ?supabase.from('ordens_servico').update(payload).eq('id',editando)
        :supabase.from('ordens_servico').insert([payload])
      const {error}=await consulta
      setSalvando(false)
      if(error){setMensagem('Erro ao salvar OS: '+error.message);return}
      setForm(vazio);setBusca('');setEditando(null);setMensagem('OS salva com sucesso.')
      await atualizarOS()
    }

    function imprimirPedido(item) {
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))||{}
      const esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
      const campo=(titulo,valor)=>'<div class="campo"><small>'+esc(titulo)+'</small><strong>'+esc(valor||'—')+'</strong></div>'
      const bloco=(titulo,valor)=>'<section><h3>'+esc(titulo)+'</h3><div class="descricao">'+esc(valor||'Não informado')+'</div></section>'
      const data=item.criado_em?dataBR(item.criado_em):dataBR(new Date())
      const nome=cliente.nome_fantasia||cliente.razao_social||cliente.nome||'Cliente cadastrado'
      const total=dinheiro(item.valor)
      const logo=new URL(LOGO,window.location.href).href
      const html=`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pedido de Venda - OS ${esc(item.numero_os)}</title><style>
      @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#20262c;margin:0;font-size:12px}
      header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #19b983;padding-bottom:14px;gap:18px}
      header img{max-width:160px;max-height:78px;object-fit:contain}header .empresa{text-align:right}header .empresa b{font-size:19px;color:#126b54}
      header .empresa p{margin:5px 0;color:#444}h1{font-size:21px;margin:20px 0 5px}h2{font-size:13px;margin:0 0 12px;color:#555;font-weight:normal}
      h3{font-size:13px;background:#e8ecef;padding:9px;margin:18px 0 10px;border-left:4px solid #19b983}
      .grade{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.campo{padding:8px 0;border-bottom:1px solid #ddd;min-width:0;overflow-wrap:anywhere}
      small{display:block;font-size:10px;text-transform:uppercase;color:#666;margin-bottom:4px}.campo strong{font-size:12px;font-weight:600}
      .descricao{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;padding:4px 2px}
      .valor{margin-top:20px;padding:16px;background:#edf5f1;display:flex;justify-content:space-between;font-size:18px;font-weight:bold}
      footer{margin-top:55px;display:flex;gap:40px}footer div{flex:1;text-align:center;border-top:1px solid #777;padding-top:8px;color:#555}
      .acoes{margin:18px 0;display:flex;gap:8px}.acoes button{padding:10px 16px;background:#168b69;color:white;border:0;border-radius:5px;cursor:pointer}
      @media print{.acoes{display:none}header,.valor,h3{-webkit-print-color-adjust:exact;print-color-adjust:exact}section{break-inside:avoid}}
      </style></head><body>
      <div class="acoes"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div>
      <header><img src="${esc(logo)}" alt="Logo Central Truck"><div class="empresa"><b>CENTRAL TRUCK SERVICE</b><p>Oficina especializada em linha diesel</p><p>Contagem - MG</p><p>WhatsApp: (31) 97525-5079</p></div></header>
      <h1>PEDIDO DE VENDA</h1><h2>Ordem de Serviço nº ${esc(item.numero_os)} • Emissão: ${esc(data)}</h2>
      <h3>DADOS DO CLIENTE</h3><div class="grade">
      ${campo('Cliente / Empresa',nome)}${campo('CNPJ',cliente.cnpj)}${campo('Telefone',cliente.telefone||cliente.whatsapp)}
      ${campo('E-mail',cliente.email)}${campo('Cidade / UF',[cliente.cidade,cliente.estado].filter(Boolean).join(' / '))}
      </div>
      ${bloco('SERVIÇOS',item.servicos)}${bloco('PEÇAS E QUANTIDADES',item.pecas)}
      <h3>PRODUTO</h3><div class="grade">${campo('Produto',item.produto)}${campo('Valor do produto',dinheiro(item.valor_produto))}</div>
      <h3>CONDIÇÕES COMERCIAIS</h3><div class="grade">${campo('Forma de pagamento',item.forma_pagamento)}${campo('Data do cadastro',data)}</div>
      <div class="valor"><span>VALOR INFORMADO DA OS</span><span>${esc(total)}</span></div>
      <footer><div>Responsável Central Truck</div><div>Cliente / Responsável</div></footer>
      </body></html>`
      const janela=window.open('','_blank')
      if(!janela){setMensagem('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');return}
      janela.document.open();janela.document.write(html);janela.document.close()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({numero_os:item.numero_os||'',empresa_id:String(item.empresa_id||''),servicos:item.servicos||'',pecas:item.pecas||'',produto:item.produto||'',valor_produto:String(item.valor_produto??''),valor:String(item.valor??''),forma_pagamento:item.forma_pagamento||''})
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))
      setBusca(cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'')
      setMensagem('')
    }
    return <>
      <div className="page-title"><div><h1>Ordens de Serviço</h1><p>Cadastro de OS com vínculo aos clientes existentes.</p></div></div>
      <section className="panel">
        <h2>{editando?'Editar OS':'Nova Ordem de Serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Número da OS *<input required value={form.numero_os} onChange={e=>setForm(v=>({...v,numero_os:e.target.value}))} placeholder="Ex.: 266"/></label>
            <label>Buscar cliente cadastrado *
              <input value={busca} onFocus={()=>setMostrarBusca(true)} onChange={e=>{setBusca(e.target.value);setForm(v=>({...v,empresa_id:''}));setMostrarBusca(true)}} placeholder="Digite nome, CNPJ ou telefone" autoComplete="off"/>
            </label>
          </div>
          {mostrarBusca && <div className="panel" style={{maxHeight:210,overflowY:'auto',padding:8,marginBottom:12}}>
            {resultados.map(e=><button type="button" key={e.id} onClick={()=>escolherEmpresa(e)} style={{display:'block',width:'100%',textAlign:'left',marginBottom:5,background:'#555b63',color:'#fff',border:'1px solid #707780',borderRadius:7}}>{e.nome_fantasia||e.razao_social||e.nome||'Cliente'} — {e.cnpj||e.telefone||e.whatsapp||'Cadastro existente'}</button>)}
            {!resultados.length && <p>Nenhum cliente encontrado. Cadastre em Empresas / Leads.</p>}
          </div>}
          {selecionada && <div className="panel" style={{marginBottom:14,padding:12}}>
            <strong>Cliente vinculado: {selecionada.nome_fantasia||selecionada.razao_social||selecionada.nome}</strong>
            <p>CNPJ: {selecionada.cnpj||'—'} | Telefone: {selecionada.telefone||'—'} | WhatsApp: {selecionada.whatsapp||'—'}</p>
            <p>E-mail: {selecionada.email||'—'} | Cidade: {selecionada.cidade||'—'} / {selecionada.estado||'—'}</p>
          </div>}
          <div className="panel" style={{marginBottom:14,padding:12}}>
            <h3>Adicionar produto ou serviço cadastrado</h3>
            <div className="form-grid">
              <label>Item<select value={itemSelecionado} onChange={e=>setItemSelecionado(e.target.value)}><option value="">Selecione um item</option>{itensCatalogo.map(item=><option key={item.id} value={item.id}>{item.tipo} — {item.nome} — {dinheiro(item.preco)}</option>)}</select></label>
              <label>Quantidade<input type="number" min="1" step="1" value={quantidadeSelecionada} onChange={e=>setQuantidadeSelecionada(e.target.value)}/></label>
            </div>
            <button type="button" onClick={adicionarItemCatalogo}>Adicionar à OS</button>
          </div>
          <div className="form-grid">
            <label>Serviços<textarea rows={4} value={form.servicos} onChange={e=>setForm(v=>({...v,servicos:e.target.value}))} placeholder="Descreva os serviços"/></label>
            <label>Peças<textarea rows={4} value={form.pecas} onChange={e=>setForm(v=>({...v,pecas:e.target.value}))} placeholder="Peças e quantidades"/></label>
            <label>Produto<input value={form.produto} onChange={e=>setForm(v=>({...v,produto:e.target.value}))} placeholder="Nome do produto"/></label>
            <label>Valor do produto (R$)<input type="number" min="0" step="0.01" value={form.valor_produto} onChange={e=>setForm(v=>({...v,valor_produto:e.target.value}))} placeholder="0,00"/></label>
            <label>Valor (R$)<input type="number" min="0" step="0.01" value={form.valor} onChange={e=>setForm(v=>({...v,valor:e.target.value}))}/></label>
            <label>Forma de pagamento<select value={form.forma_pagamento} onChange={e=>setForm(v=>({...v,forma_pagamento:e.target.value}))}>
              <option value="">Selecione</option><option>Pix</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Boleto</option><option>Ticklog</option><option>Faturado</option><option>Transferência bancária</option><option>Outro</option>
            </select></label>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Salvar OS'}</button>
            <button type="button" onClick={()=>{if(!form.numero_os.trim()||!form.empresa_id){setMensagem("Informe o número da OS e selecione um cliente para gerar o pedido.");return} imprimirPedido({...form,numero_os:form.numero_os.trim(),valor:Number(String(form.valor).replace(",","."))||0,valor_produto:Number(String(form.valor_produto).replace(",","."))||0})}} style={{background:"#555b63",color:"#fff",border:"1px solid #737b83",borderRadius:8,padding:"10px 16px",cursor:"pointer"}}>Imprimir / Salvar PDF</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio);setBusca('')}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>OS cadastradas <button type="button" onClick={atualizarOS}>Atualizar</button></h2>
        <div className="form-grid" style={{marginBottom:14}}>
          <label>Buscar por número da OS<input value={filtroNumeroOS} onChange={e=>setFiltroNumeroOS(e.target.value)} placeholder="Ex.: 267" /></label>
          <label>Filtrar por mês<input type="month" value={filtroMesOS} onChange={e=>setFiltroMesOS(e.target.value)} /></label>
        </div>
        {(filtroMesOS || filtroNumeroOS) && <button type="button" onClick={()=>{setFiltroMesOS('');setFiltroNumeroOS('')}} style={{marginBottom:12}}>Limpar filtros</button>}
        {carregandoOS?<p>Carregando...</p>:<table><thead><tr><th>OS</th><th>Cliente</th><th>Serviços</th><th>Peças</th><th>Produto</th><th>Valor do produto</th><th>Valor</th><th>Pagamento</th><th>Ações</th></tr></thead>
          <tbody>{registrosFiltrados.map(item=>{const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id));return <tr key={item.id}>
            <td>{item.numero_os}</td><td>{cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'Cliente cadastrado'}</td>
            <td>{item.servicos}</td><td>{item.pecas}</td><td>{item.produto||'—'}</td><td>{dinheiro(item.valor_produto)}</td><td>{dinheiro(item.valor)}</td><td>{item.forma_pagamento}</td>
            <td><button type="button" onClick={()=>editar(item)}>Editar</button> <button type="button" onClick={()=>imprimirPedido(item)}>Pedido / PDF / Imprimir</button></td>
          </tr>})}{!registrosFiltrados.length&&<tr><td colSpan={9}>Nenhuma OS encontrada para os filtros selecionados.</td></tr>}</tbody></table>}
      </section>
    </>
  }


  function Catalogo() {
    const vazio = {tipo:'Produto',nome:'',preco:'',custo:'',preco_manual:false,quantidade_caixa:'10',quantidade_estoque:'',fornecedor:''}
    const [form,setForm] = useState(vazio)
    const [registros,setRegistros] = useState([])
    const [editando,setEditando] = useState(null)
    const [busca,setBusca] = useState('')
    const [tipoFiltro,setTipoFiltro] = useState('Todos')
    const [salvando,setSalvando] = useState(false)
    const [excluindo,setExcluindo] = useState(null)
    const [carregando,setCarregando] = useState(false)
    const [mensagem,setMensagem] = useState('')
    async function carregar() {
      setCarregando(true)
      const {data,error}=await supabase.from('catalogo_itens').select('*').order('nome',{ascending:true})
      setCarregando(false)
      if(error){setMensagem('Erro ao consultar cadastro: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{carregar()},[])
    async function salvar(e) {
      e.preventDefault()
      setSalvando(true);setMensagem('')
      const payload={
        tipo:form.tipo,nome:form.nome.trim(),
        preco:Number(String(form.preco).replace(',','.'))||0,
        custo:Number(String(form.custo).replace(',','.'))||0,
        quantidade_caixa:form.tipo==='Produto'?Math.max(1,Number(form.quantidade_caixa)||1):1,
        quantidade_estoque:form.tipo==='Produto'?Math.max(0,Number(form.quantidade_estoque)||0):0,
        fornecedor:form.fornecedor.trim()
      }
      const {error}=editando
        ?await supabase.from('catalogo_itens').update(payload).eq('id',editando)
        :await supabase.from('catalogo_itens').insert([payload])
      setSalvando(false)
      if(error){setMensagem('Não foi possível salvar: '+error.message);return}
      setForm(vazio);setEditando(null);setMensagem('Cadastro salvo com sucesso.');await carregar()
    }
    async function excluir(item) {
      if(!window.confirm('Excluir definitivamente "'+item.nome+'" do cadastro de produtos e serviços?'))return
      setExcluindo(item.id);setMensagem('')
      const {error}=await supabase.from('catalogo_itens').delete().eq('id',item.id)
      setExcluindo(null)
      if(error){setMensagem('Não foi possível excluir: '+error.message);return}
      if(String(editando)===String(item.id)){setEditando(null);setForm(vazio)}
      setMensagem('Cadastro excluído com sucesso.')
      await carregar()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({tipo:item.tipo||'Produto',nome:item.nome||'',preco:String(item.preco??''),custo:String(item.custo??''),preco_manual:true,quantidade_caixa:String(item.quantidade_caixa??10),quantidade_estoque:String(item.quantidade_estoque??0),fornecedor:item.fornecedor||''})
      window.scrollTo({top:0,behavior:'smooth'})
    }
    const filtrados=registros.filter(item=>(tipoFiltro==='Todos'||item.tipo===tipoFiltro)&&normalizarBusca([item.nome,item.fornecedor].join(' ')).includes(normalizarBusca(busca)))
    return <>
      <div className="page-title"><div><h1>Cadastro de Produtos e Serviços</h1><p>Catálogo de preços, fornecedores e quantidades da Central Truck.</p></div></div>
      <section className="panel" style={{marginBottom:18}}>
        <h2>Buscar produtos e serviços</h2>
        <div className="form-grid">
          <label>Pesquisar produto, serviço ou fornecedor<input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Digite o nome do produto ou serviço"/></label>
          <label>Mostrar<select value={tipoFiltro} onChange={e=>setTipoFiltro(e.target.value)}><option>Todos</option><option>Produto</option><option>Serviço</option></select></label>
        </div>
        <p style={{marginTop:10,fontSize:13}}>{filtrados.length} cadastro(s) encontrado(s). {busca||tipoFiltro!=='Todos'?'Veja os resultados na lista abaixo.':'Pesquise para localizar um item já cadastrado.'}</p>
        {(busca||tipoFiltro!=='Todos')&&<button type="button" onClick={()=>{setBusca('');setTipoFiltro('Todos')}}>Limpar busca</button>}
      </section>
      <section className="panel">
        <h2>{editando?'Editar cadastro':'Novo produto ou serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Tipo *<select value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))}><option>Produto</option><option>Serviço</option></select></label>
            <label>Nome / descrição *<input required value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))} placeholder="Ex.: Filtro ARLA ou Diagnóstico eletrônico"/></label>
            <label>Valor de custo (R$)<input type="number" min="0" step="0.01" value={form.custo} onChange={e=>setForm(v=>{const custo=e.target.value;const valor=Number(custo)||0;return {...v,custo,preco:v.preco_manual?v.preco:(custo===''?'':(Math.round(valor*1.7*100)/100).toFixed(2))}})} placeholder="0,00"/></label>
            <label>Valor de venda (R$) *<input required type="number" min="0" step="0.01" value={form.preco} onChange={e=>setForm(v=>({...v,preco:e.target.value,preco_manual:true}))} placeholder="Calculado com 70% sobre o custo"/></label>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',paddingBottom:10}}>
              <span style={{fontSize:12}}>Venda sugerida: custo + 70%. Você pode alterar o preço.</span>
              <button type="button" onClick={()=>setForm(v=>({...v,preco_manual:false,preco:v.custo===''?'':(Math.round((Number(v.custo)||0)*1.7*100)/100).toFixed(2)}))}>Aplicar +70%</button>
            </div>
            <label>Fornecedor<input value={form.fornecedor} onChange={e=>setForm(v=>({...v,fornecedor:e.target.value}))} placeholder="Nome do fornecedor"/></label>
            {form.tipo==='Produto' && <>
              <label>Unidades por caixa<input type="number" min="1" step="1" value={form.quantidade_caixa} onChange={e=>setForm(v=>({...v,quantidade_caixa:e.target.value}))} placeholder="10"/></label>
              <label>Quantidade em estoque (unidades)<input type="number" min="0" step="1" value={form.quantidade_estoque} onChange={e=>setForm(v=>({...v,quantidade_estoque:e.target.value}))} placeholder="0"/></label>
            </>}
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Cadastrar'}</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio)}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>Produtos e serviços cadastrados <button type="button" onClick={carregar}>Atualizar</button></h2>

        {carregando?<p>Carregando...</p>:<table><thead><tr><th>Tipo</th><th>Produto / Serviço</th><th>Custo</th><th>Venda</th><th>Unid. / caixa</th><th>Estoque</th><th>Fornecedor</th><th>Ações</th></tr></thead><tbody>
          {filtrados.map(item=><tr key={item.id}><td>{item.tipo}</td><td>{item.nome}</td><td>{dinheiro(item.custo)}</td><td>{dinheiro(item.preco)}</td><td>{item.tipo==='Produto'?item.quantidade_caixa:'—'}</td><td>{item.tipo==='Produto'?item.quantidade_estoque:'—'}</td><td>{item.fornecedor||'—'}</td><td><div className="actions"><button type="button" className="btn-editar" onClick={()=>editar(item)}>Editar</button><button type="button" className="btn-excluir" disabled={excluindo===item.id} onClick={()=>excluir(item)}>{excluindo===item.id?"Excluindo...":"Excluir"}</button></div></td></tr>)}
          {!filtrados.length&&<tr><td colSpan={8}>Nenhum cadastro encontrado.</td></tr>}
        </tbody></table>}
      </section>
    </>
  }

  function Conteudo() {
    if (pagina === 'dashboard') return <Dashboard />
    if (pagina === 'empresas') return <Empresas />
    if (pagina === 'funil') return <Funil />
    if (pagina === 'oportunidades') return <Oportunidades />
    if (pagina === 'atendimentos') return <Atendimentos />
    if (pagina === 'agenda') return <Agenda />
    if (pagina === 'orcamentos') return <Orcamentos />
    if (pagina === 'ordens-servico') return <OrdensServico />
    if (pagina === 'catalogo') return <Catalogo />
    if (pagina === 'relatorios') return <Relatorios />
    if (pagina === 'importar') return <ImportarContatos />
    if (pagina === 'configuracoes') return <Configuracoes />
    return <Dashboard />
  }

  return (
    <div className="crm">
      <aside className="sidebar">
        <div className="brand">
          <a href="#" aria-label="Ir para o Dashboard" title="Voltar ao Dashboard" onClick={(event) => { event.preventDefault(); setPagina("dashboard") }} style={{ display: "inline-flex", cursor: "pointer" }}>
            <LogoMark className="brand-logo" />
          </a>
        </div>

        <nav>
          {MENU.map(([id, icone, nome]) => (
            <button
              key={id}
              className={pagina === id ? 'active' : ''}
              onClick={() => setPagina(id)}
            >
              <span>{icone}</span>
              {nome}
            </button>
          ))}
          <button type="button" className="logout-btn" onClick={sair} style={{ width: "100%", marginTop: "12px", textAlign: "left" }}>⇥&nbsp; Sair</button>
        </nav>

        <div className="sidebar-footer">
          <div className="online-dot"></div>
          <div>
            <b>Central Truck</b>
            <span>Sistema online</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="reference-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"24px",flexWrap:"nowrap",position:"relative",width:"100%",boxSizing:"border-box"}}>
          <div className="reference-brand" style={{flex:"0 1 auto",minWidth:0}}>
            <div className="reference-brand-name" style={{fontSize:"clamp(20px, 2.5vw, 34px)",fontWeight:900,letterSpacing:"0.015em",lineHeight:1.05,whiteSpace:"nowrap"}}>CENTRAL TRUCK <span style={{fontSize:"0.46em",letterSpacing:"0.12em",verticalAlign:"middle",whiteSpace:"nowrap"}}>★ SERVICE ★</span></div>
          </div>
          <a className="commercial-phone reference-whatsapp" style={{position:"absolute",right:"18px",top:"50%",transform:"translateY(-50%)",margin:0,flexShrink:0,display:"flex",alignItems:"center",gap:"10px"}} href="https://wa.me/5531975255079" target="_blank" rel="noreferrer">
            <img className="whatsapp-logo-img" src={ZAP_LOGO} alt="WhatsApp" />
            <span className="commercial-copy"><strong>(31) 97525-5079</strong></span>
          </a>
        </header>

        <div className="content">
          {erro && (
            <div className="error-box">
              <b>Não foi possível acessar os dados do Supabase.</b>
              <span>{erro}</span>
              <button onClick={carregarDados}>Tentar novamente</button>
            </div>
          )}

          {carregando ? (
            <div className="loading">
              <div className="loader"></div>
              <b>Carregando Central Truck CRM...</b>
              <span>Buscando informações do banco de dados.</span>
            </div>
          ) : (
            <Conteudo />
          )}
        </div>
      </main>
    </div>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento #root não encontrado no index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
),'Valor Vendido nos Últimos 30 Dias', dinheiro(valorUltimos30Dias)],
      ['R$','Valor em Oportunidades', dinheiro(valorOportunidades)],
      ['↗','Valor Vendido', dinheiro(valorVendido)],
      ['%','Conversão', `${conversao}%`],
      ['◷','Retornos Atrasados', atrasadas],
    ]
    return (
      <div className="dashboard-premium">
        <section className="dash-hero">
          <div>
            <small>Central Truck Service</small>
            <h1>Dashboard Comercial</h1>
            <p>Visão geral da operação comercial Truck exclusivo Danielle</p>
            <button className="primary" onClick={carregarDados}>↻ Atualizar dados</button>
          </div>
          <div className="hero-watermark hero-driving-scene"><img className="hero-truck-image" src={`${import.meta.env.BASE_URL}Caminhão Volvo FH 540 no Galpão Industrial.png`} alt="Volvo FH 540 em movimento" /><span className="truck-motion-streak streak-one" aria-hidden="true"></span><span className="truck-motion-streak streak-two" aria-hidden="true"></span><span className="truck-motion-streak streak-three" aria-hidden="true"></span></div>
        </section>

        <section className="kpi-grid">
          {kpis.map(([icone,titulo,valor]) => (
            <div className="kpi-card clickable-card" key={titulo} role="button" tabIndex="0" onClick={() => { const destinos={'Total de Leads':'empresas','Em Negociação':'funil','Vendas Realizadas':'orcamentos','Valor em Oportunidades':'orcamentos','Valor Vendido':'orcamentos','Conversão':'relatorios','Retornos Atrasados':'agenda'}; setPagina(destinos[titulo] || 'dashboard') }} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')e.currentTarget.click()}}>
              <div className="kpi-icon">{icone}</div>
              <span>{titulo}</span>
              <strong>{valor}</strong>
              <small><b>Central Truck</b> · atualizado</small>
            </div>
          ))}
        </section>

        <div className="dashboard-lower">
          <section className="panel strategic-panel clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('oportunidades')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('oportunidades')}}>
            <div className="panel-heading"><div><h2>Serviços Estratégicos</h2><p>Principais soluções oferecidas pela Central Truck.</p></div></div>
            <div className="service-premium-grid">
              <img
                className="strategic-services-image"
                src={`${import.meta.env.BASE_URL}servicos-estrategicos.jpg`}
                alt="Serviços Estratégicos da Central Truck"
              />
            </div>
          </section>
          <section className="panel commercial-chart clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('relatorios')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('relatorios')}}>
            <div className="panel-heading"><div><h2>Resumo Comercial</h2><p>Evolução das vendas e oportunidades.</p></div></div>
            <div className="mini-bars">
              <div><span>Leads</span><i style={{height:`${Math.min(100,Math.max(8,empresas.length*12))}%`}}></i><b>{empresas.length}</b></div>
              <div><span>Oportunidades</span><i style={{height:`${Math.min(100,Math.max(8,oportunidades.length*16))}%`}}></i><b>{oportunidades.length}</b></div>
              <div><span>Vendas finalizadas</span><i style={{height:`${Math.min(100,Math.max(8,vendas.length*22))}%`}}></i><b>{vendas.length}</b></div>
              <div><span>Orçamentos</span><i style={{height:`${Math.min(100,Math.max(8,orcamentos.length*18))}%`}}></i><b>{orcamentos.length}</b></div>
            </div>
          </section>
        </div>

        <div className="dashboard-lower">
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Últimos Leads</h2><p>Empresas cadastradas recentemente.</p></div><button onClick={()=>setPagina('empresas')}>Ver todos →</button></div>
            {ultimosLeads.length ? ultimosLeads.map((e)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={e.id} onClick={()=>setPagina('empresas')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('empresas')}}><span className="list-avatar">{(e.nome_fantasia||e.nome||'C')[0]}</span><div><b>{e.nome_fantasia||e.nome}</b><small>{e.status||'Lead novo'}</small></div><em>{e.classificacao||'B'}</em></div>) : <div className="dash-empty">Nenhum lead cadastrado.</div>}
          </section>
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Agenda vinculada</h2><p>{tarefas.length} tarefa(s) cadastrada(s) • {proximasTarefas.length} próxima(s) exibida(s).</p></div><button onClick={()=>setPagina('agenda')}>Ver agenda →</button></div>
            {proximasTarefas.length ? proximasTarefas.map((t)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={t.id} onClick={()=>setPagina('agenda')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('agenda')}}><span className="list-avatar">◷</span><div><b>{t.titulo}</b><small>{nomeEmpresa(t.empresa_id)} · {dataBR(t.data_hora)}</small></div><em>{t.prioridade||'Normal'}</em></div>) : <div className="dash-empty">Nenhuma tarefa encontrada no banco de dados. Abra a Agenda para cadastrar ou atualizar.</div>}
          </section>
        </div>
      </div>
    )
  }

 async function baixarPlanilhaClientes() {
  if (!empresas.length) { alert('Não há clientes cadastrados para baixar.'); return }

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Central Truck Service'
  workbook.created = new Date()
  const ws = workbook.addWorksheet('Clientes', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
    },
    views: [{ state: 'frozen', ySplit: 6 }]
  })

  const colunas = [
    ['Empresa',28],['Nome fantasia',28],['CNPJ',20],['Classificação',14],
    ['Segmento',20],['Cidade',20],['Estado',10],['Telefone',18],
    ['WhatsApp',18],['E-mail',30],['Site',28],['Status',20],
    ['Data do cadastro',18],['Observações',40]
  ]
  ws.columns = colunas.map(([header,width]) => ({ header, width }))
  ws.spliceRows(1, 1)
  ws.mergeCells('A1:N3')
  ws.mergeCells('A4:N4')
  ws.mergeCells('A5:N5')
  ws.getCell('A1').value = 'CENTRAL TRUCK SERVICE'
  ws.getCell('A4').value = 'RELATÓRIO DE CLIENTES / LEADS'
  ws.getCell('A5').value = 'Gestão Comercial • Exportado em ' + new Date().toLocaleString('pt-BR')

  const verde = 'FF19E6A2', escuro = 'FF061914', escuro2 = 'FF0B2A21', branco = 'FFFFFFFF', cinza = 'FFDCE9E4'
  ;['A1','A4','A5'].forEach((ref) => {
    ws.getCell(ref).alignment = { vertical:'middle', horizontal:'center' }
    ws.getCell(ref).fill = { type:'pattern', pattern:'solid', fgColor:{argb:escuro} }
    ws.getCell(ref).font = { color:{argb: ref==='A4' ? verde : branco}, bold:true, size: ref==='A1' ? 24 : ref==='A4' ? 16 : 10 }
  })
  ws.getRow(1).height = 32; ws.getRow(2).height = 18; ws.getRow(3).height = 18
  ws.getRow(4).height = 26; ws.getRow(5).height = 22

  const headerRow = ws.getRow(6)
  colunas.forEach(([titulo],i) => headerRow.getCell(i+1).value = titulo)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:verde} }
    cell.font = { color:{argb:'FF00140E'}, bold:true, size:10 }
    cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true }
    cell.border = { bottom:{style:'medium',color:{argb:'FF00A875'}} }
  })

  empresas.forEach((empresa,idx) => {
    const row = ws.addRow([
      empresa.nome || '', empresa.nome_fantasia || '', empresa.cnpj || '',
      empresa.classificacao || '', empresa.segmento || '', empresa.cidade || '',
      empresa.estado || '', empresa.telefone || '', empresa.whatsapp || '',
      empresa.email || '', empresa.site || '', empresa.status || '',
      dataBR(empresa.criado_em), empresa.observacoes || ''
    ])
    row.height = 24
    row.eachCell({includeEmpty:true}, (cell) => {
      cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb: idx%2===0 ? 'FFF5FAF8' : branco} }
      cell.font = { color:{argb:'FF17352C'}, size:10 }
      cell.alignment = { vertical:'middle', wrapText:true }
      cell.border = { bottom:{style:'thin',color:{argb:cinza}} }
    })
  })

  ws.autoFilter = { from:'A6', to:'N' + (empresas.length + 6) }
  ws.headerFooter.oddHeader = '&C&B CENTRAL TRUCK SERVICE'
  ws.headerFooter.oddFooter = '&LRelatório de Clientes&CConfidencial&R&P de &N'
  ws.pageSetup.printTitlesRow = '1:6'
  ws.pageSetup.printArea = 'A1:N' + (empresas.length + 6)

  try {
    const resposta = await fetch(LOGO)
    const blob = await resposta.blob()
    const base64 = await new Promise((resolve,reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const ext = blob.type.includes('png') ? 'png' : 'jpeg'
    const logoId = workbook.addImage({ base64, extension:ext })
    ws.addImage(logoId, { tl:{col:0.15,row:0.15}, ext:{width:125,height:72}, editAs:'oneCell' })
  } catch (e) { console.warn('Logo não inserida no Excel:', e) }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'Clientes_Central_Truck_' + new Date().toISOString().slice(0,10) + '.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

function Empresas() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const formularioEmpresaRef = React.useRef(null)
  const [salvando, setSalvando] = useState(false)
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
   const [empresaEditando, setEmpresaEditando] = useState(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState([])
  const [buscaEmpresa, setBuscaEmpresa] = useState('')
  const [filtroStatusEmpresa, setFiltroStatusEmpresa] = useState('')
  const [buscaAgenda, setBuscaAgenda] = useState('')
  const [form, setForm] = useState({
    nome: '',
    nome_fantasia: '',
    pessoa_contato: '',
    cnpj: '',
    segmento: '',
    classificacao: 'B',
    status: 'Lead novo',
    cidade: '',
    estado: 'MG',
    telefone: '',
    whatsapp: '',
    email: '',
    site: '',
    observacoes: ''
  })

  function limparCadastro() {
    sessionStorage.removeItem('empresa_rascunho')
    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    setEmpresaEditando(null)
    setForm({
      nome: '', nome_fantasia: '', pessoa_contato: '', cnpj: '',
      segmento: '', classificacao: 'B', status: 'Lead novo',
      cidade: '', estado: 'MG', telefone: '', whatsapp: '',
      email: '', site: '', observacoes: ''
    })
  }

  useEffect(() => {
    const rascunho = sessionStorage.getItem('centraltruck_empresa_em_edicao')
    if (rascunho) {
      try {
        const dados = JSON.parse(rascunho)
        if (dados && typeof dados === 'object') {
          setForm(dados)
          setMostrarFormulario(true)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (mostrarFormulario && !empresaEditando && form.nome.trim()) {
      sessionStorage.setItem('centraltruck_empresa_em_edicao', JSON.stringify(form))
    }
  }, [form, mostrarFormulario, empresaEditando])

  function alterarCampo(e) {
    const { name, value } = e.target
    setForm((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }
function editarEmpresa(empresa) {
  setEmpresaEditando(empresa)

  setForm({
    nome: empresa.nome || '',
    nome_fantasia: empresa.nome_fantasia || '',
    pessoa_contato: empresa.pessoa_contato || '',
    cnpj: empresa.cnpj || '',
    segmento: empresa.segmento === 'Diesel' ? 'Oficina - Diesel' : (empresa.segmento || ''),
    classificacao: empresa.classificacao || 'B',
    status: empresa.status || 'Lead novo',
    cidade: empresa.cidade || '',
    estado: empresa.estado || 'MG',
    telefone: empresa.telefone || '',
    whatsapp: empresa.whatsapp || '',
    email: empresa.email || '',
    site: empresa.site || '',
    observacoes: empresa.observacoes || ''
  })

  setMensagem('')
  setMostrarFormulario(true)
  requestAnimationFrame(() => {
    formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
async function excluirSelecionados() {
  if (!leadsSelecionados.length) {
    alert('Selecione pelo menos um Lead.')
    return
  }
  if (!window.confirm('Excluir os ' + leadsSelecionados.length + ' Leads selecionados?')) return

  const lote = 100
  for (let inicio = 0; inicio < leadsSelecionados.length; inicio += lote) {
    const ids = leadsSelecionados.slice(inicio, inicio + lote)

    const funil = await supabase.from('oportunidades').delete().in('empresa_id', ids)
    if (funil.error) {
      alert('Erro ao limpar os vínculos do Funil: ' + funil.error.message)
      await carregarDados()
      return
    }

    const resultado = await supabase.from('empresas').delete().in('id', ids)
    if (resultado.error) {
      alert('Erro ao excluir os Leads selecionados: ' + resultado.error.message)
      await carregarDados()
      return
    }
  }

  setLeadsSelecionados([])
  await carregarDados()
  alert('Leads selecionados excluídos com sucesso.')
}

async function excluirEmpresa(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir esta empresa? Esta ação não poderá ser desfeita.'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('Erro ao excluir empresa: ' + error.message)
    return
  }

  await carregarDados()
}
  async function salvarEmpresa(e) {
    e.preventDefault()

    if (!form.nome.trim()) {
      setMensagem('Informe o nome da empresa.')
      return
    }

    setSalvando(true)
    setMensagem('')

    const { pessoa_contato, ...camposBanco } = form
    const dados = {
      ...camposBanco,
      nome: form.nome.trim(),
      nome_fantasia: form.nome_fantasia.trim() || null,
      cnpj: form.cnpj.trim() || null,
      segmento: form.segmento.trim() || null,
      cidade: form.cidade.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      observacoes: form.observacoes.trim() || null
    }

    let resultado

if (empresaEditando) {
  resultado = await supabase
    .from('empresas')
    .update(dados)
    .eq('id', empresaEditando.id)
} else {
  resultado = await supabase
    .from('empresas')
    .insert([dados])
    .select('id')
}

const { error } = resultado


    if (error) {
      console.error(error)
      setMensagem('Erro ao cadastrar empresa: ' + error.message)
      setSalvando(false)
      return
    }

    setMensagem(empresaEditando ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!')
    sessionStorage.removeItem('empresa_rascunho')

    setForm({
      nome: '',
      nome_fantasia: '',
      pessoa_contato: '',
      cnpj: '',
      segmento: '',
      classificacao: 'B',
      status: 'Lead novo',
      cidade: '',
      estado: 'MG',
      telefone: '',
      whatsapp: '',
      email: '',
      site: '',
      observacoes: ''
    })

    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    await carregarDados()
    setSalvando(false)
    setEmpresaEditando(null)
    // Manter o formulario aberto e limpo para o proximo cadastro.
    setMostrarFormulario(true)
    requestAnimationFrame(() => {
      formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Empresas / Leads</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.4' }}>Base comercial de clientes e potenciais clientes.</p>
        </div>

        <button
          className="primary"
          onClick={() => {
            setMensagem('')
            if (mostrarFormulario) {
              setMostrarFormulario(false)
              limparCadastro()
            } else {
              limparCadastro()
              setMostrarFormulario(true)
            }
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nova Empresa'}
        </button>
        <button type="button" className="btn-exportar" onClick={baixarPlanilhaClientes}>
          ↓ Baixar planilha de clientes
        </button>
      </div>

      {mensagem && (
        <section className="panel" style={{ marginBottom: '16px' }}>
          <strong>{mensagem}</strong>
        </section>
      )}

      {mostrarFormulario && (
        <section ref={formularioEmpresaRef} className="panel" style={{ marginBottom: '20px', scrollMarginTop: '24px' }}>
          <h2>{empresaEditando ? 'Editar Empresa' : 'Nova Empresa'}</h2>

          <form onSubmit={salvarEmpresa}>
            <div className="form-grid">
              <label>
                Nome da empresa *
                <input
                  name="nome"
                  value={form.nome}
                  onChange={alterarCampo}
                  required
                />
              </label>

              <label>
                Pessoa de contato
                <input
                  name="pessoa_contato"
                  value={form.pessoa_contato}
                  onChange={alterarCampo}
                  placeholder="Ex.: Gustavo"
                />
              </label>

              <label>
                CNPJ
                <input
                  name="cnpj"
                  value={form.cnpj}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Segmento
                <select
                  name="segmento"
                  value={form.segmento}
                  onChange={alterarCampo}
                >
                  <option value="">Selecione o segmento</option>
                  <option value="Transportadora">Transportadora</option>
                  <option value="Frota Própria">Frota Própria</option>
                  <option value="Frota Terceirizada">Frota Terceirizada</option>
                  <option value="Troca de Óleo">Troca de Óleo</option>
                  <option value="Oficina - Diesel">Oficina - Diesel</option>
                  <option value="Elétrica">Elétrica</option>
                  <option value="Pessoa Física">Pessoa Física</option>
                </select>
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={alterarCampo}
                >
                  <option>Lead novo</option>
                  <option>Primeiro contato</option>
                  <option>Interessado</option>
                  <option>Visita agendada</option>
                  <option>Orçamento enviado</option>
                  <option>Em negociação</option>
                  <option>Venda realizada</option>
                  <option>Venda perdida</option>
                  <option>Pós-venda</option>
                  <option>Já é cliente</option>
                  <option>Concorrente</option>
                  <option>Futuro parceiro</option>
                  <option>Não atendeu, ligar novamente</option>
                  <option>Cliente de outro vendedor</option>
                  </select>
              </label>

              <label>
                Cidade
                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Estado
                <input
                  name="estado"
                  value={form.estado}
                  onChange={alterarCampo}
                  maxLength="2"
                />
              </label>

              <label>
                Telefone
                <input
                  name="telefone"
                  value={form.telefone}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                WhatsApp
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={alterarCampo}
                />
              </label>
            </div>

            <label style={{ display: 'block', marginTop: '14px' }}>
              Observações
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={alterarCampo}
                rows="4"
              />
            </label>

            <div style={{ marginTop: '12px', color: 'var(--muted)', fontSize: '13px' }}>Após salvar, você poderá selecionar esta empresa na seção “Agendar novo contato” abaixo.</div>
            <div style={{ marginTop: '16px' }}>
              <button
                className="primary"
                type="submit"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Empresa'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel" style={{ marginBottom: '16px' }}>
        <h3>Agendar novo contato</h3>
        <p>Selecione uma empresa cadastrada para criar um retorno diretamente na Agenda.</p>
        <input aria-label="Buscar empresa para agendar" placeholder="🔎 Buscar empresa pelo nome..." value={buscaAgenda} onChange={e => setBuscaAgenda(e.target.value)} style={{width:'100%',maxWidth:'480px',marginBottom:'8px'}} />
        <select id="empresa-agenda-rapida" defaultValue="" style={{ width: '100%', maxWidth: '480px', marginRight: '12px' }}>
          <option value="">Selecione uma empresa</option>
          {empresas.filter(empresa => normalizarBusca(empresa.nome_fantasia || empresa.nome).includes(normalizarBusca(buscaAgenda))).map(empresa => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia || empresa.nome}</option>)}
        </select>
        <button type="button" className="primary" style={{ background: '#444B54', backgroundColor: '#444B54', color: '#FFFFFF', border: '1px solid #626A74' }} onClick={() => {
          const id = document.getElementById('empresa-agenda-rapida')?.value
          if (!id) { alert('Selecione uma empresa antes de agendar.'); return }
          sessionStorage.setItem('centraltruck_agendar_empresa', id)
          setPagina('agenda')
        }}>+ Agendar novo contato</button>
      </section>

      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px'}}>
        <input aria-label="Buscar na lista de empresas" placeholder="🔎 Buscar cliente, telefone, cidade ou observações..." value={buscaEmpresa} onChange={e => setBuscaEmpresa(e.target.value)} style={{flex:'2 1 320px',minWidth:0}} />
        <select aria-label="Filtrar clientes por situação" value={filtroStatusEmpresa} onChange={e => setFiltroStatusEmpresa(e.target.value)} style={{flex:'1 1 220px',minWidth:0}}>
          <option value="">Todas as situações</option>
          <option value="Não atendeu, ligar novamente">Não atendeu / ligar novamente</option>
          {[...new Set(empresas.map(e => e.status).filter(Boolean))].filter(status => status !== 'Não atendeu, ligar novamente').sort((a,b)=>a.localeCompare(b,'pt-BR')).map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        {(buscaEmpresa || filtroStatusEmpresa) && <button type="button" onClick={()=>{setBuscaEmpresa('');setFiltroStatusEmpresa('')}}>Limpar filtros</button>}
      </div>
      <section className="panel table-wrap">
        {leadsSelecionados.length > 0 && (
          <div className="selection-toolbar">
            <strong>{leadsSelecionados.length} selecionado(s)</strong>
            <button type="button" className="btn-excluir" onClick={excluirSelecionados}>Excluir selecionados</button>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th className="select-col"><input type="checkbox" aria-label="Selecionar todos" checked={empresas.length > 0 && leadsSelecionados.length === empresas.length} onChange={(e)=>setLeadsSelecionados(e.target.checked ? empresas.map((item)=>item.id) : [])} /></th>
              <th>Empresa</th>
              <th>Segmento</th>
              <th>Cidade</th>
              <th>Telefone</th>
              <th>Status</th><th>Data do cadastro</th><th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {empresas.length > 0 ? (
              empresas.filter(empresa => (!filtroStatusEmpresa || empresa.status === filtroStatusEmpresa) && normalizarBusca([empresa.nome, empresa.nome_fantasia, empresa.telefone, empresa.whatsapp, empresa.cidade, empresa.segmento, empresa.status, empresa.pessoa_contato, empresa.observacoes].join(' ')).includes(normalizarBusca(buscaEmpresa))).map((empresa) => (
                <tr key={empresa.id}>
                  <td className="select-col"><input type="checkbox" aria-label={'Selecionar ' + (empresa.nome_fantasia || empresa.nome)} checked={leadsSelecionados.includes(empresa.id)} onChange={(e)=>setLeadsSelecionados((atuais)=>e.target.checked ? [...atuais, empresa.id] : atuais.filter((id)=>id !== empresa.id))} /></td>
                  <td>{empresa.nome}</td>
                  <td>{empresa.segmento || '-'}</td>
                  <td>
                    {empresa.cidade || '-'}
                    {empresa.estado ? ` / ${empresa.estado}` : ''}
                  </td>
                  <td>{empresa.telefone || empresa.whatsapp || '-'}</td>
                 <td>{empresa.status || '-'}</td>
<td>{dataBR(empresa.criado_em)}</td>
<td>
 
  <button
    type="button"
    onClick={() => editarEmpresa(empresa)}
    className="btn-editar"
  >
    Editar
  </button>

  <button
    type="button"
    onClick={() => excluirEmpresa(empresa.id)}
    className="btn-excluir"
  >
    Excluir
  </button>
</td>
                </tr>
              ))
            ) : (
              <tr>
<td colSpan="8" style={{ textAlign: 'center' }}>                 
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}

function Decisores() {
  const [contatos, setContatos] = useState([])
const [empresas, setEmpresas] = useState([])
const [mostrarFormDecisor, setMostrarFormDecisor] = useState(false)
const [salvandoDecisor, setSalvandoDecisor] = useState(false)
const [mensagemDecisor, setMensagemDecisor] = useState('')
    const [decisorEditandoId, setDecisorEditandoId] = useState(null)

const [formDecisor, setFormDecisor] = useState({
  empresa_id: '',
  nome: '',
  cargo: '',
  telefone: '',
  whatsapp: '',
  email: ''
})

    async function carregarDecisores() {
    const { data, error } = await supabase
      .from('contatos')
      .select(`
        *,
        empresas (
          nome
        )
      `)
      .order('nome')

    if (error) {
      console.error('Erro ao carregar decisores:', error)
      return
    }

    setContatos(data || [])
  }

  async function carregarEmpresasDecisor() {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome')
      .order('nome')

    if (error) {
      console.error('Erro ao carregar empresas:', error)
      return
    }

    setEmpresas(data || [])
  }

  useEffect(() => {
    carregarDecisores()
    carregarEmpresasDecisor()
  }, [])
    async function salvarDecisor(e) {
    e.preventDefault()
    setSalvandoDecisor(true)
    setMensagemDecisor('')

    if (!formDecisor.empresa_id || !formDecisor.nome) {
      setMensagemDecisor('Selecione a empresa e informe o nome do decisor.')
      setSalvandoDecisor(false)
      return
    }

    const dadosDecisor = {
      empresa_id: formDecisor.empresa_id,
      nome: formDecisor.nome,
      cargo: formDecisor.cargo || null,
      telefone: formDecisor.telefone || null,
      whatsapp: formDecisor.whatsapp || null,
      email: formDecisor.email || null,
      principal: true
    }
    const consultaDecisor = decisorEditandoId
      ? supabase.from('contatos').update(dadosDecisor).eq('id', decisorEditandoId)
      : supabase.from('contatos').insert([dadosDecisor])
    const { error } = await consultaDecisor

    if (error) {
      console.error('Erro ao salvar decisor:', error)
alert('Erro ao salvar decisor: ' + error.message)
  setSalvandoDecisor(false)
      return
    }

    setFormDecisor({
      empresa_id: '',
      nome: '',
      cargo: '',
      telefone: '',
      whatsapp: '',
      email: ''
    })

    setMensagemDecisor(decisorEditandoId ? 'Decisor atualizado com sucesso!' : 'Decisor cadastrado com sucesso!')
    setDecisorEditandoId(null)
    setMostrarFormDecisor(false)
    setSalvandoDecisor(false)
    await carregarDecisores()
  }

  function editarDecisor(contato) {
    setFormDecisor({
      empresa_id: contato.empresa_id || '',
      nome: contato.nome || '',
      cargo: contato.cargo || '',
      telefone: contato.telefone || '',
      whatsapp: contato.whatsapp || '',
      email: contato.email || ''
    })
    setDecisorEditandoId(contato.id)
    setMostrarFormDecisor(true)
  }

  async function excluirDecisor(id) {
  const confirmar = window.confirm('Tem certeza que deseja excluir este decisor?')

  if (!confirmar) return

  const { error } = await supabase
    .from('contatos')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir decisor: ' + error.message)
    return
  }

  await carregarDecisores()
}
  
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Decisores</h1>
            <p>Contatos responsáveis pelas decisões comerciais.</p>
          </div>
          <button
  className="btn-primary"
  onClick={() => { setDecisorEditandoId(null); setFormDecisor({ empresa_id:'', nome:'', cargo:'', telefone:'', whatsapp:'', email:'' }); setMostrarFormDecisor(true) }}
>
  + Novo Decisor
</button>
        </div>

        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Cargo</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>WhatsApp</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contatos.map((contato) => (
                <tr key={contato.id}>
                  <td><b>{contato.nome}</b></td>
                  <td>{nomeEmpresa(contato.empresa_id)}</td>
                  <td>{contato.cargo || '—'}</td>
                  <td>{contato.telefone || '—'}</td>
                  <td>{contato.email || '—'}</td>
                  <td>
                    {contato.whatsapp ? (
                      <a
                        className="whatsapp"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://wa.me/55${String(
                          contato.whatsapp
                        ).replace(/\D/g, '')}`}
                      >
                        Abrir WhatsApp
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                
        <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarDecisor(contato)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirDecisor(contato.id)}>Excluir</button></div></td>
  </tr>           
      ))}
              {!contatos.length && (
                <tr>
                  <td colSpan="7" className="empty">
                    Nenhum decisor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        {mostrarFormDecisor && (
  <section className="panel">
    <h2>{decisorEditandoId ? 'Editar Decisor' : 'Novo Decisor'}</h2>

<form onSubmit={salvarDecisor}>
  <label>Empresa</label>
      <select
        value={formDecisor.empresa_id}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, empresa_id: e.target.value })
        }
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome}
          </option>
        ))}
      </select>

      <label>Nome</label>
      <input
        type="text"
        value={formDecisor.nome}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, nome: e.target.value })
        }
      />

      <label>Cargo</label>
      <input
        type="text"
        value={formDecisor.cargo}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, cargo: e.target.value })
        }
      />

      <label>Telefone</label>
      <input
        type="text"
        value={formDecisor.telefone}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, telefone: e.target.value })
        }
      />

      <label>WhatsApp</label>
      <input
        type="text"
        value={formDecisor.whatsapp}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, whatsapp: e.target.value })
        }
      />

      <label>E-mail</label>
      <input
        type="email"
        value={formDecisor.email}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, email: e.target.value })
        }
      />

     <button type="submit" className="btn-primary" disabled={salvandoDecisor}>
{salvandoDecisor ? 'Salvando...' : 'Salvar Decisor'}
     </button>

      <button
        type="button"
        onClick={() => setMostrarFormDecisor(false)}
      >
        Cancelar
      </button>
    </form>
  </section>
)}
      </>
    )
  }

  async function excluirOportunidade(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta oportunidade?')) return
    const { error } = await supabase.from('oportunidades').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir oportunidade: ' + error.message)
      return
    }
    await carregarDados()
  }

  function Funil() {
    const [agendamentosFunil, setAgendamentosFunil] = useState({})

    async function agendarEEnviarWhatsApp(item) {
      const dataHora = agendamentosFunil[item.id]
      if (!dataHora) {
        alert('Selecione a data e a hora do agendamento.')
        return
      }

      const empresaNome = nomeEmpresa(item.empresa_id)
      const dataFormatada = new Date(dataHora).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })

      const { error } = await supabase.from('tarefas').insert([{
        empresa_id: item.empresa_id || null,
        titulo: 'Agendamento - ' + (item.titulo || empresaNome),
        descricao: 'Agendamento criado pelo Funil Comercial. Etapa: ' + item.etapa,
        data_hora: dataHora,
        prioridade: 'Normal',
        status: 'Pendente'
      }])

      if (error) {
        alert('Erro ao salvar o agendamento: ' + error.message)
        return
      }

      await carregarDados()

      const mensagem = [
        '📅 *AGENDAMENTO CENTRAL TRUCK*',
        '',
        'Empresa: ' + empresaNome,
        'Oportunidade: ' + (item.titulo || '-'),
        'Etapa: ' + item.etapa,
        'Data e hora: ' + dataFormatada
      ].join('\n')

      window.open('https://wa.me/5531975255079?text=' + encodeURIComponent(mensagem), '_blank', 'noopener,noreferrer')
    }

    const etapas = [
      'Lead Novo',
      'Primeiro Contato',
      'Interessado',
      'Visita Agendada',
      'Orçamento Enviado',
      'Em Negociação',
      'Venda Realizada',
      'Venda Perdida',
      'Pós-venda',
    ]


    async function moverOportunidade(id, novaEtapa) {
  const { error } = await supabase
    .from('oportunidades')
    .update({ etapa: novaEtapa })
    .eq('id', id)

  if (error) {
    alert('Erro ao alterar etapa: ' + error.message)
    return
  }

  await carregarDados()
}
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Funil Comercial</h1>
            <p>Acompanhamento das oportunidades por etapa.</p>
          </div>
        </div>

        <div className="kanban">
          {etapas.map((etapa) => {
            const itens = oportunidades.filter((o) => o.etapa === etapa)

            return (
              <div className="kanban-column" key={etapa}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.outline = '2px solid #19df91' }}
                onDragLeave={(e) => { e.currentTarget.style.outline = '' }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.outline = ''
                  const id = e.dataTransfer.getData('text/plain')
                  const item = oportunidades.find(o => String(o.id) === id)
                  if (item && item.etapa !== etapa) moverOportunidade(item.id, etapa)
                }}>
                <div className="kanban-title">
                  <b>{etapa}</b>
                  <span>{itens.length}</span>
                </div>

                {itens.map((item) => (
                 <details className="deal" key={item.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(item.id)); e.dataTransfer.effectAllowed = "move" }} style={{padding:"10px 12px",minHeight:0,cursor:"grab"}}>
  <summary style={{cursor:"pointer",fontWeight:700,listStyle:"revert",overflowWrap:"anywhere"}}>{nomeEmpresa(item.empresa_id) || item.titulo}</summary>
  <div style={{display:"grid",gap:"8px",marginTop:"12px"}}>
  <b>{item.titulo || nomeEmpresa(item.empresa_id)}</b>
  <strong>{dinheiro(item.valor_estimado)}</strong>



  <label className="deal-schedule-label">
    Data e hora do agendamento
    <input
      className="deal-schedule-input"
      type="datetime-local"
      value={agendamentosFunil[item.id] || ''}
      onChange={(e) => setAgendamentosFunil({ ...agendamentosFunil, [item.id]: e.target.value })}
    />
  </label>
  <button type="button" className="btn-whatsapp" onClick={() => agendarEEnviarWhatsApp(item)}>
    Agendar e enviar no WhatsApp
  </button>
  <button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button>
</div>
</details>
                ))}

                {!itens.length && (
                  <div className="kanban-empty">Nenhuma oportunidade</div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  function Oportunidades() {
      const [mostrarFormOportunidade, setMostrarFormOportunidade] = useState(false)
  const [salvandoOportunidade, setSalvandoOportunidade] = useState(false)
  const [mensagemOportunidade, setMensagemOportunidade] = useState('')
  const [selecionadas, setSelecionadas] = useState([])
  const [excluindoLote, setExcluindoLote] = useState(false)
  async function excluirSelecionadas() {
    if (!selecionadas.length || excluindoLote) return
    if (!window.confirm('Excluir definitivamente ' + selecionadas.length + ' oportunidade(s) selecionada(s)? Os cadastros das empresas serão preservados.')) return
    setExcluindoLote(true)
    const {error} = await supabase.from('oportunidades').delete().in('id', selecionadas)
    setExcluindoLote(false)
    if (error) { alert('Não foi possível excluir: ' + error.message); return }
    setSelecionadas([])
    await carregarDados()
  }

  const [formOportunidade, setFormOportunidade] = useState({
    empresa_id: '',
    titulo: '',
    servico: '',
    etapa: 'Lead Novo',
    valor_estimado: '',
    probabilidade: 0,
    previsao_fechamento: '',
    observacoes: ''
  })

  async function salvarOportunidade(e) {
    e.preventDefault()

    if (!formOportunidade.empresa_id || !formOportunidade.titulo) {
      setMensagemOportunidade('Selecione a empresa e informe o título da oportunidade.')
      return
    }

    setSalvandoOportunidade(true)
    setMensagemOportunidade('')

    const { error } = await supabase
      .from('oportunidades')
      .insert([{
        empresa_id: formOportunidade.empresa_id,
        titulo: formOportunidade.titulo,
        servico: formOportunidade.servico || null,
        etapa: formOportunidade.etapa,
        valor_estimado: formOportunidade.valor_estimado
          ? Number(formOportunidade.valor_estimado)
          : null,
        probabilidade: Number(formOportunidade.probabilidade) || 0,
        previsao_fechamento: formOportunidade.previsao_fechamento || null,
        observacoes: formOportunidade.observacoes || null
      }])

    if (error) {
      alert('Erro ao salvar oportunidade: ' + error.message)
      setSalvandoOportunidade(false)
      return
    }

    setFormOportunidade({
      empresa_id: '',
      titulo: '',
      servico: '',
      etapa: 'Lead Novo',
      valor_estimado: '',
      probabilidade: 0,
      previsao_fechamento: '',
      observacoes: ''
    })

    setMensagemOportunidade('Oportunidade cadastrada com sucesso!')
    setMostrarFormOportunidade(false)
    setSalvandoOportunidade(false)

    await carregarDados()
  }
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Oportunidades</h1>
            <p>Negociações comerciais em andamento.</p>
          </div>
        </div>
<button
  type="button"
  className="btn-primary"
  onClick={() => setMostrarFormOportunidade(true)}
>
  + Nova Oportunidade
</button>
<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginTop:12,marginBottom:12}}>
  <button type="button" onClick={()=>setSelecionadas(oportunidades.map(o=>o.id))}>Selecionar todas</button>
  <button type="button" onClick={()=>setSelecionadas([])}>Limpar seleção</button>
  <button type="button" className="btn-excluir" disabled={!selecionadas.length || excluindoLote} onClick={excluirSelecionadas}>
    {excluindoLote ? 'Excluindo...' : 'Excluir selecionadas ('+selecionadas.length+')'}
  </button>
</div>

{mensagemOportunidade && (
  <p>{mensagemOportunidade}</p>
)}
        {mostrarFormOportunidade && (
  <section className="panel">
    <h2>Nova Oportunidade</h2>

    <form onSubmit={salvarOportunidade}>

      <label>Empresa</label>
      <select
        value={formOportunidade.empresa_id}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            empresa_id: e.target.value
          })
        }
        required
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome_fantasia || empresa.nome}
          </option>
        ))}
      </select>

      <label>Título da oportunidade</label>
      <input
        type="text"
        value={formOportunidade.titulo}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            titulo: e.target.value
          })
        }
        placeholder="Ex.: Manutenção sistema ARLA"
        required
      />

      <label>Serviço</label>
      <select
        value={formOportunidade.servico}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            servico: e.target.value
          })
        }
      >
        <option value="">Selecione</option>
        <option value="Catalisador">Catalisador</option>
        <option value="ARLA 32">ARLA 32</option>
        <option value="Diálise">Diálise</option>
        <option value="Diagnóstico">Diagnóstico</option>
        <option value="Sistema SCR">Sistema SCR</option>
        <option value="DPF">DPF</option>
        <option value="Injeção Diesel">Injeção Diesel</option>
        <option value="Elétrica">Elétrica</option>
        <option value="Mecânica Diesel">Mecânica Diesel</option>
      </select>

      <label>Etapa</label>
      <select
        value={formOportunidade.etapa}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            etapa: e.target.value
          })
        }
      >
        <option value="Lead Novo">Lead Novo</option>
        <option value="Primeiro Contato">Primeiro Contato</option>
        <option value="Interessado">Interessado</option>
        <option value="Visita Agendada">Visita Agendada</option>
        <option value="Orçamento Enviado">Orçamento Enviado</option>
        <option value="Em Negociação">Em Negociação</option>
        <option value="Venda Realizada">Venda Realizada</option>
        <option value="Venda Perdida">Venda Perdida</option>
        <option value="Pós-venda">Pós-venda</option>
                  <option value="Já é cliente">Já é cliente</option>
      </select>

      <label>Valor estimado (R$)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={formOportunidade.valor_estimado}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            valor_estimado: e.target.value
          })
        }
      />

      <label>Probabilidade (%)</label>
      <input
        type="number"
        min="0"
        max="100"
        value={formOportunidade.probabilidade}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            probabilidade: e.target.value
          })
        }
      />

      <label>Previsão de fechamento</label>
      <input
        type="date"
        value={formOportunidade.previsao_fechamento}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            previsao_fechamento: e.target.value
          })
        }
      />

      <label>Observações</label>
      <textarea
        value={formOportunidade.observacoes}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            observacoes: e.target.value
          })
        }
      />

      <div>
        <button
          type="submit"
          className="btn-primary"
          disabled={salvandoOportunidade}
        >
          {salvandoOportunidade ? 'Salvando...' : 'Salvar Oportunidade'}
        </button>

        <button
          type="button"
          onClick={() => setMostrarFormOportunidade(false)}
        >
          Cancelar
        </button>
      </div>

    </form>
  </section>
)}
        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Selecionar todas as oportunidades" checked={oportunidades.length>0 && oportunidades.every(o=>selecionadas.includes(o.id))} onChange={e=>setSelecionadas(e.target.checked?oportunidades.map(o=>o.id):[])} /></th>
                <th>Oportunidade</th>
                <th>Empresa</th>
                <th>Serviço</th>
                <th>Etapa</th>
                <th>Valor</th>
                <th>Probabilidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" aria-label={'Selecionar '+(item.titulo||'oportunidade')} checked={selecionadas.includes(item.id)} onChange={e=>setSelecionadas(v=>e.target.checked?[...v,item.id]:v.filter(id=>id!==item.id))}/></td>
                  <td><b>{item.titulo || 'Oportunidade'}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.servico || '—'}</td>
                  <td><span className="status">{item.etapa}</span></td>
                  <td>{dinheiro(item.valor_estimado)}</td>
                  <td>{item.probabilidade || 0}%</td>
                  <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarOportunidade(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button></div></td>
                </tr>
              ))}

              {!oportunidades.length && (
                <tr>
                  <td colSpan="8" className="empty">
                    Nenhuma oportunidade cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </>
    )
  }
function Atendimentos() {
  const [mostrarFormAtendimento, setMostrarFormAtendimento] = useState(false)
const [salvandoAtendimento, setSalvandoAtendimento] = useState(false)
const [mensagemAtendimento, setMensagemAtendimento] = useState('')
const [atendimentoEditandoId, setAtendimentoEditandoId] = useState(null)

const [formAtendimento, setFormAtendimento] = useState({
  empresa_id: '',
  tipo: 'Ligação',
  descricao: '',
  data_atividade: new Date().toISOString().slice(0, 10),
  proximo_retorno: '',
  concluido: false
})

function editarAtendimento(item) {
  setFormAtendimento({
    empresa_id: item.empresa_id || '',
    tipo: item.tipo || 'Ligação',
    descricao: item.descricao || '',
    data_atividade: item.data_atividade ? String(item.data_atividade).slice(0,10) : new Date().toISOString().slice(0,10),
    proximo_retorno: item.proximo_retorno ? String(item.proximo_retorno).slice(0,10) : '',
    concluido: !!item.concluido
  })
  setAtendimentoEditandoId(item.id)
  setMostrarFormAtendimento(true)
}

async function excluirAtendimento(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir este atendimento?'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('atividades')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir atendimento: ' + error.message)
    return
  }

  await carregarDados()
} 
  async function salvarAtendimento(e) {
  e.preventDefault()

  if (!formAtendimento.empresa_id || !formAtendimento.descricao) {
    alert('Selecione a empresa e informe a descrição do atendimento.')
    return
  }

  setSalvandoAtendimento(true)

  const dadosAtendimento = {
    empresa_id: Number(formAtendimento.empresa_id),
    tipo: formAtendimento.tipo,
    descricao: formAtendimento.descricao,
    data_atividade: formAtendimento.data_atividade,
    proximo_retorno: formAtendimento.proximo_retorno || null,
    concluido: formAtendimento.concluido
  }
  const consultaAtendimento = atendimentoEditandoId
    ? supabase.from('atividades').update(dadosAtendimento).eq('id', atendimentoEditandoId)
    : supabase.from('atividades').insert([dadosAtendimento])
  const { error } = await consultaAtendimento

  if (error) {
    alert('Erro ao salvar atendimento: ' + error.message)
    setSalvandoAtendimento(false)
    return
  }

  setMensagemAtendimento(atendimentoEditandoId ? 'Atendimento atualizado com sucesso!' : 'Atendimento registrado com sucesso!')
  setAtendimentoEditandoId(null)
  setMostrarFormAtendimento(false)
  setSalvandoAtendimento(false)

  setFormAtendimento({
    empresa_id: '',
    tipo: 'Ligação',
    descricao: '',
    data_atividade: new Date().toISOString().slice(0, 10),
    proximo_retorno: '',
    concluido: false
  })

  await carregarDados()
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Atendimentos</h1>
          <p>Histórico de contatos e atividades comerciais.</p>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={() => { setAtendimentoEditandoId(null); setFormAtendimento({ empresa_id:'', tipo:'Ligação', descricao:'', data_atividade:new Date().toISOString().slice(0,10), proximo_retorno:'', concluido:false }); setMostrarFormAtendimento(true) }}
      >
        + Novo Atendimento
      </button>

      {mensagemAtendimento && (
        <p>{mensagemAtendimento}</p>
      )}

      {mostrarFormAtendimento && (
        <section className="panel">
          <form onSubmit={salvarAtendimento}>

            <label>Empresa</label>
            <select
              value={formAtendimento.empresa_id}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  empresa_id: e.target.value
                })
              }
              required
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>

            <label>Tipo de atendimento</label>
            <select
              value={formAtendimento.tipo}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  tipo: e.target.value
                })
              }
            >
              <option value="Ligação">Ligação</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Visita">Visita</option>
              <option value="E-mail">E-mail</option>
              <option value="Reunião">Reunião</option>
              <option value="Orçamento">Orçamento</option>
              <option value="Observação">Observação</option>
            </select>

            <label>Descrição</label>
            <textarea
              value={formAtendimento.descricao}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  descricao: e.target.value
                })
              }
              placeholder="Descreva o atendimento realizado..."
              required
            />

            <label>Data do atendimento</label>
            <input
              type="date"
              value={formAtendimento.data_atividade}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  data_atividade: e.target.value
                })
              }
            />

            <label>Próximo retorno</label>
            <input
              type="date"
              value={formAtendimento.proximo_retorno}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  proximo_retorno: e.target.value
                })
              }
            />

            <label>
              <input
                type="checkbox"
                checked={formAtendimento.concluido}
                onChange={(e) =>
                  setFormAtendimento({
                    ...formAtendimento,
                    concluido: e.target.checked
                  })
                }
              />
              Atendimento concluído
            </label>

            <div>
              <button
                type="submit"
                className="btn-primary"
                disabled={salvandoAtendimento}
              >
                {salvandoAtendimento ? 'Salvando...' : 'Salvar Atendimento'}
              </button>

              <button
                type="button"
                onClick={() => setMostrarFormAtendimento(false)}
              >
                Cancelar
              </button>
            </div>

          </form>
        </section>
      )}

      <section className="panel">
        {atividades.map((item) => (
          <div className="activity" key={item.id}>
            <div className="activity-icon"></div>

            <div>
              <b>{item.tipo || 'Atendimento'}</b>
              <span>{nomeEmpresa(item.empresa_id)}</span>
              <p>{item.descricao || 'Sem descrição.'}</p>

              {item.proximo_retorno && (
                <p>
                  Próximo retorno: {dataBR(item.proximo_retorno)}
                </p>
              )}
            </div>

            <small>{dataBR(item.data_atividade)}</small>
            <div className="actions">{linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade) && <a className="btn-whatsapp" href={linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade)} target="_blank" rel="noreferrer">WhatsApp</a>}<button type="button" className="btn-editar" onClick={() => editarAtendimento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirAtendimento(item.id)}>Excluir</button></div>
          </div>
        ))}

        {!atividades.length && (
          <div className="empty">
            Nenhum atendimento registrado. Os botões Editar e Excluir aparecerão em cada atendimento cadastrado.
          </div>
        )}
      </section>
    </>
  )
}
  function Agenda() {
    const [mostrarFormTarefa, setMostrarFormTarefa] = useState(() => !!sessionStorage.getItem('centraltruck_agendar_empresa') || !!localStorage.getItem('ct_rascunho_agenda'))
    const [salvandoTarefa, setSalvandoTarefa] = useState(false)
    const [mensagemTarefa, setMensagemTarefa] = useState('')
    const [lembrarNoCRM, setLembrarNoCRM] = useState(true)
    const [antecedencia, setAntecedencia] = useState('0')
    const [avisosAgenda, setAvisosAgenda] = useState([])
    const numeroLembrete = '31975255079'
    useEffect(() => {
      const verificar = () => {
        const agora = Date.now()
        const avisos = tarefas.filter(t => {
          if (t.status === 'Concluída' || !t.data_hora || localStorage.getItem('ct_lembrete_' + t.id) === 'nao') return false
          const prazo = new Date(t.data_hora).getTime() - Number(localStorage.getItem('ct_antecedencia_' + t.id) || 0) * 60000
          return prazo <= agora && agora - prazo < 86400000
        })
        setAvisosAgenda(avisos)
        avisos.forEach(t => {
          const chave = 'ct_aviso_exibido_' + t.id + '_' + t.data_hora
          if (!sessionStorage.getItem(chave) && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Central Truck — Lembrete', {body: t.titulo + ' • ' + (nomeEmpresa(t.empresa_id) || 'Contato')})
            sessionStorage.setItem(chave, 'sim')
          }
        })
      }
      verificar()
      const intervalo = setInterval(verificar, 60000)
      return () => clearInterval(intervalo)
    }, [tarefas])
    const whatsappParaMim = tarefa => {
      const telefone = numeroLembrete.replace(/\D/g, '')
      const destino = telefone.startsWith('55') ? telefone : '55' + telefone
      const mensagem = 'LEMBRETE CENTRAL TRUCK%0A' + encodeURIComponent('Cliente: ' + nomeEmpresa(tarefa.empresa_id) + '\nTarefa: ' + tarefa.titulo + '\nData: ' + dataBR(tarefa.data_hora) + '\n' + (tarefa.descricao || ''))
      return 'https://wa.me/' + destino + '?text=' + mensagem
    }

    const [tarefaEditandoId, setTarefaEditandoId] = useState(null)
    const [formTarefa, setFormTarefa] = useState(() => {
       try { const salvo = JSON.parse(localStorage.getItem('ct_rascunho_agenda') || 'null'); if (salvo && typeof salvo === 'object') return salvo } catch (_) {}
       return { empresa_id: '', cliente_avulso: '', titulo: '', descricao: '', data_hora: '', prioridade: 'Normal', status: 'Pendente' }
     })
     useEffect(() => {
       if (mostrarFormTarefa) localStorage.setItem('ct_rascunho_agenda', JSON.stringify(formTarefa))
     }, [formTarefa, mostrarFormTarefa])

    useEffect(() => {
      const id = sessionStorage.getItem('centraltruck_agendar_empresa')
      if (id) {
        setFormTarefa(anterior => ({ ...anterior, empresa_id: id, titulo: 'Retornar contato', status: 'Pendente' }))
        setMostrarFormTarefa(true)
        sessionStorage.removeItem('centraltruck_agendar_empresa')
      }
    }, [])

    function editarTarefa(item) {
      setFormTarefa({
        empresa_id: item.empresa_id || '',
        cliente_avulso: (item.descricao || '').match(/^Cliente não cadastrado: (.*?)(?:\n|$)/)?.[1] || '',
        titulo: item.titulo || '',
        descricao: (item.descricao || '').replace(/^Cliente não cadastrado: .*?(?:\n|$)/, ''),
        data_hora: item.data_hora ? String(item.data_hora).slice(0,16) : '',
        prioridade: item.prioridade || 'Normal',
        status: item.status || 'Pendente'
      })
      setTarefaEditandoId(item.id)
      setLembrarNoCRM(localStorage.getItem('ct_lembrete_' + item.id) !== 'nao')
      setAntecedencia(localStorage.getItem('ct_antecedencia_' + item.id) || '0')
      setMostrarFormTarefa(true)
    }

    async function excluirTarefa(id) {
      const confirmar = window.confirm('Tem certeza que deseja excluir esta tarefa?')
      if (!confirmar) return

      const { error } = await supabase.from('tarefas').delete().eq('id', id)
      if (error) {
        alert('Erro ao excluir tarefa: ' + error.message)
        return
      }
      await carregarDados()
    }

    async function salvarTarefa(e) {
      e.preventDefault()

      if (!formTarefa.titulo.trim() || !formTarefa.data_hora) {
        alert('Informe o título e a data/hora da tarefa.')
        return
      }

      setSalvandoTarefa(true)
      setMensagemTarefa('')

      const dadosTarefa = {
        empresa_id: formTarefa.empresa_id ? Number(formTarefa.empresa_id) : null,
        titulo: formTarefa.titulo.trim(),
        descricao: [!formTarefa.empresa_id && formTarefa.cliente_avulso.trim() ? 'Cliente não cadastrado: ' + formTarefa.cliente_avulso.trim() : '', formTarefa.descricao.trim()].filter(Boolean).join('\n') || null,
        data_hora: formTarefa.data_hora,
        prioridade: formTarefa.prioridade,
        status: formTarefa.status,
      }
      const consultaTarefa = tarefaEditandoId
        ? supabase.from('tarefas').update(dadosTarefa).eq('id', tarefaEditandoId)
        : supabase.from('tarefas').insert([dadosTarefa])
      const { error } = await consultaTarefa

      if (error) {
        alert('Erro ao salvar tarefa: ' + error.message)
        setSalvandoTarefa(false)
        return
      }

      const idSalvo = tarefaEditandoId
      if (idSalvo) { localStorage.setItem('ct_lembrete_' + idSalvo, lembrarNoCRM ? 'sim' : 'nao'); localStorage.setItem('ct_antecedencia_' + idSalvo, antecedencia) }
      localStorage.removeItem('ct_rascunho_agenda')
       setMensagemTarefa(tarefaEditandoId ? 'Tarefa atualizada com sucesso!' : 'Tarefa cadastrada com sucesso!')
      setTarefaEditandoId(null)
      setMostrarFormTarefa(false)
      setSalvandoTarefa(false)
      setFormTarefa({
        empresa_id: '',
        titulo: '',
        descricao: '',
        data_hora: '',
        prioridade: 'Normal',
        status: 'Pendente',
      })
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Agenda</h1>
            <p>Retornos, ligações, visitas e tarefas comerciais. {tarefas.length} tarefa(s) sincronizada(s) com o Dashboard.</p>
          </div>
        </div>

        <button type="button" className="btn-secondary" onClick={carregarDados} style={{marginRight:12}}>↻ Atualizar agendamentos</button>
        {erro && <p role="alert">Erro ao carregar agenda: {erro}</p>}
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setTarefaEditandoId(null); setFormTarefa({ empresa_id:'', cliente_avulso:'', titulo:'', descricao:'', data_hora:'', prioridade:'Normal', status:'Pendente' }); setMostrarFormTarefa(true) }}
        >
          + Nova Tarefa
        </button>

        {mostrarFormTarefa && (
          <section className="panel form-panel">
            <form onSubmit={salvarTarefa}>
              <div className="form-grid">
                <label>
                  Empresa
                  <select
                    value={formTarefa.empresa_id}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, empresa_id: e.target.value })
                    }
                  >
                    <option value="">Sem empresa vinculada</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome_fantasia || empresa.nome}
                      </option>
                    ))}
                  </select>
                </label>

                {!formTarefa.empresa_id && (
                  <label>
                    Nome do cliente não cadastrado
                    <input
                      type="text"
                      value={formTarefa.cliente_avulso || ''}
                      onChange={(e) => setFormTarefa({ ...formTarefa, cliente_avulso: e.target.value })}
                      placeholder="Digite o nome do cliente ou empresa"
                    />
                  </label>
                )}

                <label>
                  Título
                  <input
                    type="text"
                    value={formTarefa.titulo}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, titulo: e.target.value })
                    }
                    placeholder="Ex.: Retornar para cliente"
                    required
                  />
                </label>

                <label>
                  Data e hora
                  <input
                    type="datetime-local"
                    value={formTarefa.data_hora}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, data_hora: e.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Prioridade
                  <select
                    value={formTarefa.prioridade}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, prioridade: e.target.value })
                    }
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={formTarefa.status}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, status: e.target.value })
                    }
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </label>

                <label className="full">
                  Descrição
                  <textarea
                    value={formTarefa.descricao}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, descricao: e.target.value })
                    }
                    placeholder="Observações sobre a tarefa..."
                  />
                </label>
              </div>

              <div style={{margin:'12px 0',display:'flex',gap:'14px',flexWrap:'wrap',alignItems:'center'}}><label><input type="checkbox" checked={lembrarNoCRM} onChange={e=>setLembrarNoCRM(e.target.checked)} /> Lembrar no CRM</label><label>Antecedência <select value={antecedencia} onChange={e=>setAntecedencia(e.target.value)}><option value="0">Na hora</option><option value="15">15 minutos</option><option value="60">1 hora</option><option value="1440">1 dia</option></select></label><button type="button" onClick={() => { if ('Notification' in window) Notification.requestPermission(); else alert('Seu navegador não suporta notificações.'); }}>Ativar notificações do navegador</button></div><p style={{fontSize:'12px'}}>Avisos automáticos funcionam enquanto o CRM estiver aberto. O envio pelo WhatsApp exige clicar em enviar.</p>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={salvandoTarefa}>
                  {salvandoTarefa ? 'Salvando...' : 'Salvar Tarefa'}
                </button>
                <button type="button" onClick={() => setMostrarFormTarefa(false)}>
                  Cancelar
                </button>
              </div>

              {mensagemTarefa && <p>{mensagemTarefa}</p>}
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-heading"><div><h2>Agendamentos cadastrados ({tarefas.length})</h2><p>Todos os contatos salvos na Agenda.</p></div></div>
          {tarefas.map((tarefa) => (
            <div className="activity" key={tarefa.id}>
              <div className="activity-icon">✓</div>
              <div>
                <b>{tarefa.titulo}</b>
                <span>{nomeEmpresa(tarefa.empresa_id)}</span>
                <p>{tarefa.descricao || 'Sem descrição.'}</p>
              </div>
              <div className="task-date">
                <b>{dataBR(tarefa.data_hora)}</b>
                <span>{tarefa.status}</span>
                <div className="actions">
                  <a className="btn-whatsapp" href={whatsappParaMim(tarefa)} target="_blank" rel="noreferrer">🔔 Lembrete no meu WhatsApp</a>
                  <button type="button" className="btn-editar" onClick={() => editarTarefa(tarefa)}>Editar</button>
                  <button type="button" className="btn-excluir" onClick={() => excluirTarefa(tarefa.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
          {!tarefas.length && (
            <div className="empty">Nenhuma tarefa cadastrada.</div>
          )}
        </section>
      </>
    )
  }

  function Orcamentos() {
    const chaveRascunho = 'centraltruck_orcamento_rascunho_' + (session?.user?.id || 'local')
    const [mostrarForm, setMostrarForm] = useState(() => {
      try { return Boolean(JSON.parse(localStorage.getItem(chaveRascunho))?.aberto) } catch { return false }
    })
    const [salvando, setSalvando] = useState(false)
    const [filtroMes, setFiltroMes] = useState('')
    const [filtroInicio, setFiltroInicio] = useState('')
    const [filtroFim, setFiltroFim] = useState('')
    const orcamentosFiltrados = orcamentos.filter(item => {
      if (!item.data_envio) return !filtroMes && !filtroInicio && !filtroFim
      const data = String(item.data_envio).slice(0,10)
      if (filtroMes && data.slice(0,7) !== filtroMes) return false
      if (filtroInicio && data < filtroInicio) return false
      if (filtroFim && data > filtroFim) return false
      return true
    })
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(() => {
      try { return JSON.parse(localStorage.getItem(chaveRascunho))?.editandoId ?? null } catch { return null }
    })
    const [osAberta, setOsAberta] = useState(null)
    const [osArquivos, setOsArquivos] = useState([])
    const [osErro, setOsErro] = useState('')
    const [osEnviando, setOsEnviando] = useState(false)
    async function carregarOS(item) {
      setOsAberta(item)
      setOsErro('')
      const {data,error} = await supabase.storage.from('orcamento-anexos').list(String(item.id))
      if(error){setOsErro('Armazenamento indisponível: '+error.message);setOsArquivos([]);return}
      setOsArquivos((data||[]).filter(x=>x.name!=='.emptyFolderPlaceholder'))
    }
    async function anexarOS(e) {
      const arquivo=e.target.files?.[0]
      e.target.value=''
      if(!arquivo||!osAberta)return
      if(arquivo.size>10485760){setOsErro('Limite de 10 MB por arquivo.');return}
      if(!/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(arquivo.name)){setOsErro('Selecione PDF, Word ou imagem.');return}
      setOsEnviando(true)
      setOsErro('')
      try {
        const nome=Date.now()+'-'+arquivo.name.replace(/[^a-zA-Z0-9._-]/g,'_')
        const {error}=await supabase.storage.from('orcamento-anexos').upload(String(osAberta.id)+'/'+nome,arquivo)
        if(error)throw error
        await carregarOS(osAberta)
      }catch(error){setOsErro('Erro ao salvar OS: '+error.message)}
      finally{setOsEnviando(false)}
    }
    async function visualizarOS(nome) {
      const {data,error}=await supabase.storage.from('orcamento-anexos').createSignedUrl(String(osAberta.id)+'/'+nome,120)
      if(error){setOsErro(error.message);return}
      window.open(data.signedUrl,'_blank','noopener,noreferrer')
    }
    const [form, setForm] = useState(() => {
      let anterior = null
      try { anterior = JSON.parse(localStorage.getItem(chaveRascunho))?.form } catch {}
      return anterior || {
      empresa_id: '',
      oportunidade_id: '',
      numero_orcamento: '',
      descricao: '',
      valor: '',
      status: 'Enviado',
      data_envio: new Date().toISOString().slice(0, 10),
      validade: '',
      observacoes: '',
      }
    })
    useEffect(() => {
      if (mostrarForm) localStorage.setItem(chaveRascunho, JSON.stringify({aberto:true,editandoId:orcamentoEditandoId,form}))
    }, [mostrarForm, orcamentoEditandoId, form, chaveRascunho])

    async function salvarOrcamento(e) {
      e.preventDefault()
      if (!form.empresa_id || !form.descricao) {
        alert('Selecione a empresa e informe a descrição.')
        return
      }
      setSalvando(true)
      const dadosOrcamento = {
        empresa_id: Number(form.empresa_id),
        oportunidade_id: form.oportunidade_id ? Number(form.oportunidade_id) : null,
        numero_orcamento: form.numero_orcamento.trim() || null,
        descricao: form.descricao.trim(),
        valor: form.valor ? Number(form.valor) : null,
        status: form.status,
        data_envio: form.data_envio || null,
        validade: form.validade || null,
        observacoes: form.observacoes.trim() || null,
      }
      const consultaOrcamento = orcamentoEditandoId
        ? supabase.from('orcamentos').update(dadosOrcamento).eq('id', orcamentoEditandoId)
        : supabase.from('orcamentos').insert([dadosOrcamento])
      const { error } = await consultaOrcamento
      if (error) {
        alert('Erro ao salvar orçamento: ' + error.message)
        setSalvando(false)
        return
      }
      setForm({
        empresa_id: '', oportunidade_id: '', numero_orcamento: '', descricao: '',
        valor: '', status: 'Enviado', data_envio: new Date().toISOString().slice(0, 10),
        validade: '', observacoes: '',
      })
      localStorage.removeItem(chaveRascunho)
      setOrcamentoEditandoId(null)
      setMostrarForm(false)
      setSalvando(false)
      await carregarDados()
    }

    function editarOrcamento(item) {
      setForm({
        empresa_id: item.empresa_id || '',
        oportunidade_id: item.oportunidade_id || '',
        numero_orcamento: item.numero_orcamento || '',
        descricao: item.descricao || '',
        valor: item.valor ?? '',
        status: item.status || 'Enviado',
        data_envio: item.data_envio ? String(item.data_envio).slice(0,10) : '',
        validade: item.validade ? String(item.validade).slice(0,10) : '',
        observacoes: item.observacoes || ''
      })
      setOrcamentoEditandoId(item.id)
      setMostrarForm(true)
    }

    async function excluirOrcamento(id) {
      if (!window.confirm('Excluir este orçamento?')) return
      const { error } = await supabase.from('orcamentos').delete().eq('id', id)
      if (error) return alert('Erro ao excluir orçamento: ' + error.message)
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Orçamentos</h1>
            <p>Controle dos orçamentos enviados aos clientes.</p>
          </div>
          <button className="primary" onClick={() => {
            if (mostrarForm) { localStorage.removeItem(chaveRascunho); setMostrarForm(false); setOrcamentoEditandoId(null); return }
            setOrcamentoEditandoId(null)
            setForm({ empresa_id:'', oportunidade_id:'', numero_orcamento:'', descricao:'', valor:'', status:'Enviado', data_envio:new Date().toISOString().slice(0,10), validade:'', observacoes:'' })
            setMostrarForm(true)
          }}>
            {mostrarForm ? 'Cancelar' : '+ Novo Orçamento'}
          </button>
        </div>

        {mostrarForm && (
          <section className="panel">
            <h2>{orcamentoEditandoId ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
            <form onSubmit={salvarOrcamento}>
              <div className="form-grid">
                <label>Empresa *
                  <select value={form.empresa_id} onChange={(e) => setForm({...form, empresa_id:e.target.value})} required>
                    <option value="">Selecione</option>
                    {empresas.map((x)=><option key={x.id} value={x.id}>{x.nome_fantasia || x.nome}</option>)}
                  </select>
                </label>
                <label>Oportunidade
                  <select value={form.oportunidade_id} onChange={(e) => setForm({...form, oportunidade_id:e.target.value})}>
                    <option value="">Sem vínculo</option>
                    {oportunidades.filter((x)=>!form.empresa_id || String(x.empresa_id)===String(form.empresa_id)).map((x)=><option key={x.id} value={x.id}>{x.titulo}</option>)}
                  </select>
                </label>
                <label>Número
                  <input value={form.numero_orcamento} onChange={(e)=>setForm({...form,numero_orcamento:e.target.value})} placeholder="Ex.: ORC-001"/>
                </label>
                <label>Valor (R$)
                  <input type="number" min="0" step="0.01" value={form.valor} onChange={(e)=>setForm({...form,valor:e.target.value})}/>
                </label>
                <label>Status
                  <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                    {['Rascunho','Enviado','Visualizado','Em negociação','Aprovado','Recusado','Finalizado'].map((x)=><option key={x}>{x}</option>)}
                  </select>
                </label>
                <label>Data de envio
                  <input type="date" value={form.data_envio} onChange={(e)=>setForm({...form,data_envio:e.target.value})}/>
                </label>
                <label>Validade
                  <input type="date" value={form.validade} onChange={(e)=>setForm({...form,validade:e.target.value})}/>
                </label>
                <label className="full">Descrição *
                  <textarea value={form.descricao} onChange={(e)=>setForm({...form,descricao:e.target.value})} required/>
                </label>
                <label className="full">Observações
                  <textarea value={form.observacoes} onChange={(e)=>setForm({...form,observacoes:e.target.value})}/>
                </label>
              </div>
              <div className="form-actions">
                <button className="primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar Orçamento'}</button>
              </div>
            </form>
          </section>
        )}

        {osAberta && <section className="panel">
          <h2>Anexar OS — Orçamento {osAberta.numero_orcamento || osAberta.id}</h2>
          <p>Selecione PDF, Word ou imagem (máximo 10 MB).</p>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={osEnviando} onChange={anexarOS}/>
          {osEnviando && <p>Enviando...</p>}
          {osErro && <p role="alert" style={{color:'#ff8585'}}>{osErro}</p>}
          {osArquivos.map(a=><div key={a.name} style={{marginTop:10}}>
            <span>{a.name} </span>
            <button type="button" onClick={()=>visualizarOS(a.name)}>Abrir / baixar</button>
          </div>)}
          <button type="button" onClick={()=>setOsAberta(null)}>Fechar</button>
        </section>}
        <section className="panel" style={{marginBottom:16}}>
          <h2>Filtrar orçamentos por mês e data</h2>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}>
            <label>Mês <input type="month" value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/></label>
            <label>Data inicial <input type="date" value={filtroInicio} onChange={e=>setFiltroInicio(e.target.value)}/></label>
            <label>Data final <input type="date" value={filtroFim} onChange={e=>setFiltroFim(e.target.value)}/></label>
            <button type="button" onClick={()=>{setFiltroMes('');setFiltroInicio('');setFiltroFim('')}}>Limpar filtros</button>
          </div>
          <p>{orcamentosFiltrados.length} orçamento(s) encontrado(s)</p>
        </section>
        <section className="panel table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Empresa</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Envio</th><th>Ações</th></tr></thead>
            <tbody>
              {orcamentosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.numero_orcamento || `#${item.id}`}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.descricao || '—'}</td>
                  <td>{dinheiro(item.valor)}</td>
                  <td><span className="status">{item.status}</span></td>
                  <td>{dataBR(item.data_envio)}</td>
                  <td><div className="actions"><button type="button" onClick={() => carregarOS(item)}>Anexar OS</button><button type="button" className="btn-editar" onClick={() => editarOrcamento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={()=>excluirOrcamento(item.id)}>Excluir</button></div></td>
                </tr>
              ))}
              {!orcamentos.length && <tr><td colSpan="7" className="empty">Nenhum orçamento cadastrado.</td></tr>}
            </tbody>
          </table>
        </section>
      </>
    )
  }

  function Relatorios() {
    const [arquivoLeads, setArquivoLeads] = useState(null)
    const [importandoLeads, setImportandoLeads] = useState(false)
    const [msgImportacao, setMsgImportacao] = useState('')

    async function baixarModeloLeads() {
      const XLSX = await import('xlsx')
      const dados = [
        ['CENTRAL TRUCK SERVICE'],
        ['LISTA DE LEADS - IMPORTACAO PARA O CRM'],
        [],
        ['Nome da empresa','Nome fantasia','CNPJ','Segmento','Classificacao','Status','Cidade','Estado','Telefone','WhatsApp','E-mail','Site','Observacoes'],
        ['Transportadora Exemplo','Exemplo Logistica','','Transportadora','A','Lead novo','Contagem','MG','31999999999','31999999999','contato@exemplo.com.br','','Cliente para prospeccao']
      ]
      const ws = XLSX.utils.aoa_to_sheet(dados)
      ws['!merges'] = [XLSX.utils.decode_range('A1:M1'), XLSX.utils.decode_range('A2:M2')]
      ws['!cols'] = [{wch:28},{wch:26},{wch:20},{wch:20},{wch:15},{wch:20},{wch:20},{wch:10},{wch:18},{wch:18},{wch:30},{wch:28},{wch:38}]
      ws['!rows'] = [{hpt:34},{hpt:25},{hpt:8},{hpt:28}]
      ws['!autofilter'] = { ref: 'A4:M5' }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Leads Central Truck')
      XLSX.writeFile(wb, 'Modelo_Leads_Central_Truck.xlsx')
    }

    function separarCSV(linha) {
      const valores = []
      let atual = ''
      let aspas = false
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i]
        if (ch === '"') {
          if (aspas && linha[i + 1] === '"') { atual += '"'; i++ } else aspas = !aspas
        } else if ((ch === ',' || ch === ';') && !aspas) {
          valores.push(atual.trim()); atual = ''
        } else atual += ch
      }
      valores.push(atual.trim())
      return valores
    }

    async function importarLeads() {
      if (!arquivoLeads) { setMsgImportacao('Selecione um arquivo para continuar.'); return }
      const extensao = (arquivoLeads.name.split('.').pop() || '').toLowerCase()
      if (extensao !== 'csv') {
        setMsgImportacao('Arquivo recebido sem alterar o original. PDF, JPG/PNG e Word podem ser enviados e mantidos no formato original; para cadastrar clientes automaticamente no Funil, use CSV.')
        return
      }
      setImportandoLeads(true)
      setMsgImportacao('')
      try {
        const texto = await arquivoLeads.text()
        const linhas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim())
        if (linhas.length < 2) throw new Error('O arquivo está vazio ou sem clientes.')
        const colunas = separarCSV(linhas[0]).map((x) => x.toLowerCase().trim())
        const obrigatoria = colunas.indexOf('nome')
        if (obrigatoria < 0) throw new Error('A coluna "nome" é obrigatória. Use o modelo disponível.')
        let importados = 0
        let falhas = 0
        for (const linha of linhas.slice(1)) {
          const valores = separarCSV(linha)
          const registro = {}
          colunas.forEach((col, idx) => { registro[col] = (valores[idx] || '').trim() })
          if (!registro.nome) { falhas++; continue }
          const status = registro.status || 'Lead novo'
          const empresa = {
            nome: registro.nome,
            nome_fantasia: registro.nome_fantasia || null,
            cnpj: registro.cnpj || null,
            segmento: registro.segmento || null,
            classificacao: ['A','B','C'].includes((registro.classificacao || '').toUpperCase()) ? registro.classificacao.toUpperCase() : 'B',
            status,
            cidade: registro.cidade || null,
            estado: registro.estado || 'MG',
            telefone: registro.telefone || null,
            whatsapp: registro.whatsapp || null,
            email: registro.email || null,
            site: registro.site || null,
            observacoes: registro.observacoes || null
          }
          const { data: criada, error: erroEmpresa } = await supabase.from('empresas').insert([empresa]).select('id').single()
          if (erroEmpresa || !criada?.id) { falhas++; continue }
          importados++
        }
        await carregarDados()
        setArquivoLeads(null)
        setMsgImportacao(importados + ' cliente(s) importado(s) para Empresas/Leads. Oportunidades só serão criadas quando cadastradas explicitamente.' + (falhas ? ' ' + falhas + ' linha(s) com erro.' : ''))
      } catch (e) {
        setMsgImportacao('Erro na importação: ' + e.message)
      } finally {
        setImportandoLeads(false)
      }
    }

    return (
      <>
        <div className="page-title"><div><h1>Relatórios</h1><p>Indicadores comerciais da Central Truck.</p></div></div>
        <section className="cards">
          <Card titulo="Leads" valor={empresas.length} />
          <Card titulo="Contatos" valor={contatos.length} />
          <Card titulo="Oportunidades" valor={oportunidades.length} />
          <Card titulo="Vendas" valor={vendas.length} />
          <Card titulo="Conversão" valor={`${conversao}%`} />
          <Card titulo="Valor Vendido" valor={dinheiro(valorVendido)} />
        </section>
        <section className="panel lead-import-panel">
          <div className="panel-heading">
            <div><h2>Enviar relatórios e importar clientes</h2><p>Selecione PDF, JPG, PNG, Word ou CSV. O arquivo original é mantido sem alteração; listas em CSV podem ser organizadas automaticamente em Empresas/Leads e no Funil Comercial.</p></div>
          </div>
          <div className="lead-import-actions">
            <button type="button" className="btn-secondary" onClick={baixarModeloLeads}>Baixar modelo Excel</button>
            <label className="file-import-box">
              <span>{arquivoLeads ? arquivoLeads.name : 'Selecionar lista de clientes (.CSV)'}</span>
              <input type="file" accept=".csv,text/csv" onChange={(e)=>{setArquivoLeads(e.target.files?.[0] || null);setMsgImportacao('')}} />
            </label>
            <button type="button" className="primary" disabled={importandoLeads || !arquivoLeads} onClick={importarLeads}>{importandoLeads ? 'Importando...' : 'Importar clientes para o Funil'}</button>
          </div>
          <p className="import-help"><b>Importação de clientes:</b> use CSV para cadastrar automaticamente Empresas/Leads e criar as oportunidades no Funil. Colunas aceitas: nome, nome_fantasia, CNPJ, segmento, classificação A/B/C, status, cidade, estado, telefone, WhatsApp, e-mail, site e observações.</p>
          <div className="import-message"><b>Relatórios PDF, JPG, PNG e Word:</b> são documentos para consulta e não são convertidos automaticamente em clientes, evitando perda de formatação ou cadastro incorreto. Para importar uma lista desses formatos, converta-a primeiro para CSV usando o modelo acima.</div>
          {msgImportacao && <div className="import-message">{msgImportacao}</div>}
        </section>
      </>
    )
  }


  function ImportarContatos() {
    const [arquivo, setArquivo] = useState(null)
    const [importando, setImportando] = useState(false)
    const [mensagem, setMensagem] = useState('')

    const normalizar = (v='') => String(v ?? '').trim()
    const chave = (v='') => normalizar(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')

    function valorCampo(registro, nomes) {
      for (const nome of nomes) {
        const k = Object.keys(registro).find(x => chave(x) === chave(nome))
        if (k && normalizar(registro[k])) return normalizar(registro[k])
      }
      return ''
    }

    async function lerArquivo(file) {
      const ext=(file.name.split('.').pop()||'').toLowerCase()
      if (['xlsx','xls','xlsm','xlsb','ods','csv','txt'].includes(ext)) {
        const XLSX=await import('xlsx')
        const buffer=await file.arrayBuffer()
        const wb=XLSX.read(buffer,{type:'array'})
        const aliases=['empresa','nome da empresa','razao social','nome fantasia','nome','cliente','oficina','estabelecimento','organizacao','company','organization','contato','nome do contato','telefone','celular','whatsapp','email','e-mail','endereco','cidade','cnpj','responsavel']
        const saida=[]
        for(const nomeAba of wb.SheetNames){
          const matriz=XLSX.utils.sheet_to_json(wb.Sheets[nomeAba],{header:1,defval:'',raw:false,blankrows:false})
          if(!matriz.length) continue
          const pontuacao=linha=>(Array.isArray(linha)?linha:[]).filter(c=>aliases.some(a=>chave(c)===chave(a)||chave(c).startsWith(chave(a))&&chave(a).length>4)).length
          const candidatos=matriz.slice(0,30).map((linha,i)=>({i,p:pontuacao(linha)})).sort((a,b)=>b.p-a.p)
          const indice=candidatos[0]?.p>=2?candidatos[0].i:-1
          if(indice<0) continue
          const titulos=matriz[indice].map((c,i)=>normalizar(c)||'Coluna '+(i+1))
          const registros=matriz.slice(indice+1).filter(linha=>Array.isArray(linha)&&linha.some(c=>normalizar(c))).map(linha=>Object.fromEntries(titulos.map((titulo,i)=>[titulo,linha[i]??''])))
          saida.push(...registros)
        }
        if(!saida.length) throw new Error('Não identifiquei automaticamente os campos desta planilha. Envie uma planilha com títulos como Nome, Empresa, Telefone ou E-mail.')
        return saida
      }
      if (['json'].includes(ext)) {
        const obj=JSON.parse(await file.text())
        return Array.isArray(obj)?obj:(obj.contatos||obj.clientes||obj.empresas||[])
      }
      if (['vcf','vcard'].includes(ext)) {
        const texto=await file.text()
        return texto.split(/BEGIN:VCARD/i).slice(1).map(bloco=>{
          const pega=(re)=>((bloco.match(re)||[])[1]||'').trim()
          return {nome:pega(/\nFN[^:]*:([^\r\n]+)/i),telefone:pega(/\nTEL[^:]*:([^\r\n]+)/i),email:pega(/\nEMAIL[^:]*:([^\r\n]+)/i),empresa:pega(/\nORG[^:]*:([^\r\n]+)/i)}
        })
      }
      throw new Error('Formato não compatível para importação automática.')
    }

    async function importar() {
      if(!arquivo){setMensagem('Selecione um arquivo.');return}
      setImportando(true); setMensagem('')
      try{
        const linhas=await lerArquivo(arquivo)
        if(!linhas.length) throw new Error('Nenhum contato encontrado no arquivo.')
        let ok=0, erros=0
        for(const r of linhas){
          const nomeEmpresa=valorCampo(r,['nome da empresa','empresa','razao social','razão social','nome fantasia','cliente','oficina','estabelecimento','organização','nome','company','organization','org','nome do contato','contato'])
          const contato=valorCampo(r,['pessoa de contato','contato','responsavel','responsável','nome do contato','nome decisor / contato','contact','contact name'])
          const camposTelefone = Object.keys(r).filter(k => /^(telefone|fone|tel|celular|whatsapp|whats|zap|phone|mobile|contatotelefonico|numero)/.test(chave(k)))
          const telefone=valorCampo(r,['telefone','telefone comercial','fone','phone','celular','mobile','telefone 1','telefone principal','telefone 2','telefone de contato','contato telefonico','fone/whatsapp','telefone/whatsapp','tel','numero de telefone']) || camposTelefone.map(k => normalizar(r[k])).find(Boolean) || ''
          const whatsapp=valorCampo(r,['whatsapp','telefone direto / whatsapp','telefone direto whatsapp','whats app','zap','celular whatsapp','telefone whatsapp']) || telefone
          const email=valorCampo(r,['email','e-mail','e-mail corporativo / público','email corporativo publico','mail','correio eletronico'])
          const cidade=valorCampo(r,['cidade','city'])
          const estado=valorCampo(r,['estado','uf','state']) || 'MG'
          const segmento=valorCampo(r,['segmento','categoria','ramo'])
          const status=valorCampo(r,['status','etapa']) || 'Lead novo'
          const cnpj=valorCampo(r,['cnpj','cpf/cnpj','documento'])
          const observacoes=[valorCampo(r,['observacoes','observações','obs','notes']),...['Cargo / área decisora','Frota / operação','Tecnologias / equipamentos','Prioridade','LinkedIn decisor','Funcionários estimados'].map(c=>valorCampo(r,[c])?c+': '+valorCampo(r,[c]):'')].filter(Boolean).join(' | ')
          if(!nomeEmpresa){erros++;continue}
          const dados={nome:nomeEmpresa,nome_fantasia:null,cnpj:cnpj||null,segmento:segmento||null,status,cidade:cidade||null,estado,telefone:telefone||null,whatsapp:whatsapp||null,email:email||null,observacoes:[contato?'Contato: '+contato:'',observacoes].filter(Boolean).join(' | ')||null}
          const {error}=await supabase.from('empresas').insert([dados])
          if(error) { erros++; console.error('Falha ao importar empresa:',nomeEmpresa,error); }
          else ok++
        }
        await carregarDados()
        if(ok>0) {
          setPagina('empresas')
          window.alert(ok+' empresa(s) salva(s) em Empresas / Leads.'+(erros?' '+erros+' registro(s) falharam; confira o console para detalhes.':''))
        } else {
          setMensagem('Nenhuma empresa foi salva. '+erros+' registro(s) falharam. Confira os nomes das empresas e as permissões de gravação no Supabase.')
        }
      }catch(e){setMensagem('Erro: '+e.message)}
      finally{setImportando(false)}
    }

    return <>
      <div className="page-title"><div><h1>Importar Contatos</h1><p>Importe listas de contatos e clientes diretamente para o CRM.</p></div></div>
      <section className="panel lead-import-panel">
        <h2>Selecionar arquivo</h2>
        <p>Compatível com planilhas Excel antigas e atuais, CSV, ODS, TXT, JSON e contatos VCF/vCard.</p>
        <div className="lead-import-actions">
          <label className="file-import-box">
            <span>{arquivo?arquivo.name:'Selecionar arquivo de contatos'}</span>
            <input type="file" accept=".xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.txt,.json,.vcf,.vcard" onChange={e=>{setArquivo(e.target.files?.[0]||null);setMensagem('')}} />
          </label>
          <button type="button" className="primary" disabled={!arquivo||importando} onClick={importar}>{importando?'Importando...':'Importar para o CRM'}</button>
        </div>
        <p className="import-help"><b>Campos reconhecidos automaticamente:</b> empresa, pessoa de contato, CNPJ, segmento, status, cidade, estado, telefone, WhatsApp, e-mail e observações. Os títulos podem variar, por exemplo: Empresa, Razão Social, Contato, Responsável, Fone, Celular, UF ou E-mail.</p>
        <div className="import-message"><b>PDF, JPG/PNG e Word:</b> podem ser mantidos em Relatórios, mas não são convertidos automaticamente em contatos para evitar cadastros incorretos.</div>
        {mensagem&&<div className="import-message">{mensagem}</div>}
      </section>
    </>
  }

  function Configuracoes() {
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Configurações</h1>
            <p>Informações gerais do CRM.</p>
          </div>
        </div>

        <section className="panel config">
          <h2>Central Truck Service</h2>
          <p><b>Sistema:</b> Central Truck CRM</p>
          <p><b>Banco de dados:</b> Supabase</p>
          <p><b>Hospedagem:</b> GitHub Pages</p>
          <p><b>Moeda:</b> Real brasileiro (BRL)</p>
          <p><b>Idioma:</b> Português do Brasil</p>

          <button className="primary" onClick={carregarDados}>
            Testar conexão com banco
          </button>
        </section>
      </>
    )
  }


  function OrdensServico() {
    const vazio = {numero_os:'',empresa_id:'',servicos:'',pecas:'',produto:'',valor_produto:'',valor:'',forma_pagamento:''}
    const [registros,setRegistros] = useState([])
    const [itensCatalogo,setItensCatalogo] = useState([])
    const [itemSelecionado,setItemSelecionado] = useState('')
    const [quantidadeSelecionada,setQuantidadeSelecionada] = useState('1')
    const [busca,setBusca] = useState(() => localStorage.getItem('centraltruck_os_busca') || '')
    const [filtroMesOS,setFiltroMesOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_mes') || '')
    const [filtroNumeroOS,setFiltroNumeroOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_numero') || '')
    const [form,setForm] = useState(() => { try { return {...vazio,...JSON.parse(localStorage.getItem('centraltruck_os_rascunho') || '{}')} } catch { return vazio } })
    const [editando,setEditando] = useState(() => localStorage.getItem('centraltruck_os_editando') || null)
    const [mensagem,setMensagem] = useState('')
    const [salvando,setSalvando] = useState(false)
    const [mostrarBusca,setMostrarBusca] = useState(false)
    const [carregandoOS,setCarregandoOS] = useState(false)
    useEffect(() => { localStorage.setItem('centraltruck_os_rascunho',JSON.stringify(form)) },[form])
    useEffect(() => { localStorage.setItem('centraltruck_os_busca',busca) },[busca])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_mes',filtroMesOS) },[filtroMesOS])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_numero',filtroNumeroOS) },[filtroNumeroOS])
    useEffect(() => { if(editando) localStorage.setItem('centraltruck_os_editando',editando); else localStorage.removeItem('centraltruck_os_editando') },[editando])
    const registrosFiltrados = registros.filter(item => (!filtroMesOS || String(item.criado_em || '').slice(0,7) === filtroMesOS) && (!filtroNumeroOS || normalizarBusca(item.numero_os).includes(normalizarBusca(filtroNumeroOS.trim()))))
    const selecionada = empresas.find(e=>String(e.id)===String(form.empresa_id))
    const resultados = empresas.filter(e=>normalizarBusca([e.nome_fantasia,e.razao_social,e.nome,e.cnpj,e.telefone,e.whatsapp].join(' ')).includes(normalizarBusca(busca))).slice(0,30)
    async function atualizarOS() {
      setCarregandoOS(true)
      const {data,error}=await supabase.from('ordens_servico').select('*').order('criado_em',{ascending:false})
      setCarregandoOS(false)
      if(error) {setMensagem('Não foi possível consultar as OS: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{atualizarOS()},[])
    useEffect(()=>{supabase.from('catalogo_itens').select('*').order('nome',{ascending:true}).then(({data,error})=>{if(!error)setItensCatalogo(data||[])})},[])
    function adicionarItemCatalogo() {
      const item=itensCatalogo.find(i=>String(i.id)===String(itemSelecionado))
      if(!item){setMensagem('Selecione um produto ou serviço cadastrado.');return}
      const qtd=Math.max(1,Math.floor(Number(quantidadeSelecionada)||1))
      const subtotal=(Number(item.preco)||0)*qtd
      const linha=qtd+' x '+item.nome+' — '+dinheiro(subtotal)
      setForm(v=>item.tipo==='Serviço'
        ?{...v,servicos:[v.servicos,linha].filter(Boolean).join('\n')}
        :{...v,pecas:[v.pecas,linha].filter(Boolean).join('\n'),produto:v.produto||item.nome,valor_produto:(Number(String(v.valor_produto).replace(',','.'))||0)+subtotal})
      setItemSelecionado('');setQuantidadeSelecionada('1');setMensagem('Item incluído. Confira o valor total antes de salvar.')
    }
    function escolherEmpresa(e) {
      setForm(v=>({...v,empresa_id:String(e.id)}))
      setBusca(e.nome_fantasia||e.razao_social||e.nome||'')
      setMostrarBusca(false)
    }
    async function salvar(e) {
      e.preventDefault()
      if(!form.empresa_id) {setMensagem('Selecione um cliente cadastrado na busca.');return}
      setSalvando(true);setMensagem('')
      const payload={numero_os:form.numero_os.trim(),empresa_id:form.empresa_id,servicos:form.servicos,pecas:form.pecas,produto:form.produto,valor_produto:Number(String(form.valor_produto).replace(',','.'))||0,valor:Number(String(form.valor).replace(',','.'))||0,forma_pagamento:form.forma_pagamento}
      const consulta=editando
        ?supabase.from('ordens_servico').update(payload).eq('id',editando)
        :supabase.from('ordens_servico').insert([payload])
      const {error}=await consulta
      setSalvando(false)
      if(error){setMensagem('Erro ao salvar OS: '+error.message);return}
      setForm(vazio);setBusca('');setEditando(null);setMensagem('OS salva com sucesso.')
      await atualizarOS()
    }

    function imprimirPedido(item) {
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))||{}
      const esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
      const campo=(titulo,valor)=>'<div class="campo"><small>'+esc(titulo)+'</small><strong>'+esc(valor||'—')+'</strong></div>'
      const bloco=(titulo,valor)=>'<section><h3>'+esc(titulo)+'</h3><div class="descricao">'+esc(valor||'Não informado')+'</div></section>'
      const data=item.criado_em?dataBR(item.criado_em):dataBR(new Date())
      const nome=cliente.nome_fantasia||cliente.razao_social||cliente.nome||'Cliente cadastrado'
      const total=dinheiro(item.valor)
      const logo=new URL(LOGO,window.location.href).href
      const html=`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pedido de Venda - OS ${esc(item.numero_os)}</title><style>
      @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#20262c;margin:0;font-size:12px}
      header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #19b983;padding-bottom:14px;gap:18px}
      header img{max-width:160px;max-height:78px;object-fit:contain}header .empresa{text-align:right}header .empresa b{font-size:19px;color:#126b54}
      header .empresa p{margin:5px 0;color:#444}h1{font-size:21px;margin:20px 0 5px}h2{font-size:13px;margin:0 0 12px;color:#555;font-weight:normal}
      h3{font-size:13px;background:#e8ecef;padding:9px;margin:18px 0 10px;border-left:4px solid #19b983}
      .grade{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.campo{padding:8px 0;border-bottom:1px solid #ddd;min-width:0;overflow-wrap:anywhere}
      small{display:block;font-size:10px;text-transform:uppercase;color:#666;margin-bottom:4px}.campo strong{font-size:12px;font-weight:600}
      .descricao{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;padding:4px 2px}
      .valor{margin-top:20px;padding:16px;background:#edf5f1;display:flex;justify-content:space-between;font-size:18px;font-weight:bold}
      footer{margin-top:55px;display:flex;gap:40px}footer div{flex:1;text-align:center;border-top:1px solid #777;padding-top:8px;color:#555}
      .acoes{margin:18px 0;display:flex;gap:8px}.acoes button{padding:10px 16px;background:#168b69;color:white;border:0;border-radius:5px;cursor:pointer}
      @media print{.acoes{display:none}header,.valor,h3{-webkit-print-color-adjust:exact;print-color-adjust:exact}section{break-inside:avoid}}
      </style></head><body>
      <div class="acoes"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div>
      <header><img src="${esc(logo)}" alt="Logo Central Truck"><div class="empresa"><b>CENTRAL TRUCK SERVICE</b><p>Oficina especializada em linha diesel</p><p>Contagem - MG</p><p>WhatsApp: (31) 97525-5079</p></div></header>
      <h1>PEDIDO DE VENDA</h1><h2>Ordem de Serviço nº ${esc(item.numero_os)} • Emissão: ${esc(data)}</h2>
      <h3>DADOS DO CLIENTE</h3><div class="grade">
      ${campo('Cliente / Empresa',nome)}${campo('CNPJ',cliente.cnpj)}${campo('Telefone',cliente.telefone||cliente.whatsapp)}
      ${campo('E-mail',cliente.email)}${campo('Cidade / UF',[cliente.cidade,cliente.estado].filter(Boolean).join(' / '))}
      </div>
      ${bloco('SERVIÇOS',item.servicos)}${bloco('PEÇAS E QUANTIDADES',item.pecas)}
      <h3>PRODUTO</h3><div class="grade">${campo('Produto',item.produto)}${campo('Valor do produto',dinheiro(item.valor_produto))}</div>
      <h3>CONDIÇÕES COMERCIAIS</h3><div class="grade">${campo('Forma de pagamento',item.forma_pagamento)}${campo('Data do cadastro',data)}</div>
      <div class="valor"><span>VALOR INFORMADO DA OS</span><span>${esc(total)}</span></div>
      <footer><div>Responsável Central Truck</div><div>Cliente / Responsável</div></footer>
      </body></html>`
      const janela=window.open('','_blank')
      if(!janela){setMensagem('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');return}
      janela.document.open();janela.document.write(html);janela.document.close()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({numero_os:item.numero_os||'',empresa_id:String(item.empresa_id||''),servicos:item.servicos||'',pecas:item.pecas||'',produto:item.produto||'',valor_produto:String(item.valor_produto??''),valor:String(item.valor??''),forma_pagamento:item.forma_pagamento||''})
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))
      setBusca(cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'')
      setMensagem('')
    }
    return <>
      <div className="page-title"><div><h1>Ordens de Serviço</h1><p>Cadastro de OS com vínculo aos clientes existentes.</p></div></div>
      <section className="panel">
        <h2>{editando?'Editar OS':'Nova Ordem de Serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Número da OS *<input required value={form.numero_os} onChange={e=>setForm(v=>({...v,numero_os:e.target.value}))} placeholder="Ex.: 266"/></label>
            <label>Buscar cliente cadastrado *
              <input value={busca} onFocus={()=>setMostrarBusca(true)} onChange={e=>{setBusca(e.target.value);setForm(v=>({...v,empresa_id:''}));setMostrarBusca(true)}} placeholder="Digite nome, CNPJ ou telefone" autoComplete="off"/>
            </label>
          </div>
          {mostrarBusca && <div className="panel" style={{maxHeight:210,overflowY:'auto',padding:8,marginBottom:12}}>
            {resultados.map(e=><button type="button" key={e.id} onClick={()=>escolherEmpresa(e)} style={{display:'block',width:'100%',textAlign:'left',marginBottom:5,background:'#555b63',color:'#fff',border:'1px solid #707780',borderRadius:7}}>{e.nome_fantasia||e.razao_social||e.nome||'Cliente'} — {e.cnpj||e.telefone||e.whatsapp||'Cadastro existente'}</button>)}
            {!resultados.length && <p>Nenhum cliente encontrado. Cadastre em Empresas / Leads.</p>}
          </div>}
          {selecionada && <div className="panel" style={{marginBottom:14,padding:12}}>
            <strong>Cliente vinculado: {selecionada.nome_fantasia||selecionada.razao_social||selecionada.nome}</strong>
            <p>CNPJ: {selecionada.cnpj||'—'} | Telefone: {selecionada.telefone||'—'} | WhatsApp: {selecionada.whatsapp||'—'}</p>
            <p>E-mail: {selecionada.email||'—'} | Cidade: {selecionada.cidade||'—'} / {selecionada.estado||'—'}</p>
          </div>}
          <div className="panel" style={{marginBottom:14,padding:12}}>
            <h3>Adicionar produto ou serviço cadastrado</h3>
            <div className="form-grid">
              <label>Item<select value={itemSelecionado} onChange={e=>setItemSelecionado(e.target.value)}><option value="">Selecione um item</option>{itensCatalogo.map(item=><option key={item.id} value={item.id}>{item.tipo} — {item.nome} — {dinheiro(item.preco)}</option>)}</select></label>
              <label>Quantidade<input type="number" min="1" step="1" value={quantidadeSelecionada} onChange={e=>setQuantidadeSelecionada(e.target.value)}/></label>
            </div>
            <button type="button" onClick={adicionarItemCatalogo}>Adicionar à OS</button>
          </div>
          <div className="form-grid">
            <label>Serviços<textarea rows={4} value={form.servicos} onChange={e=>setForm(v=>({...v,servicos:e.target.value}))} placeholder="Descreva os serviços"/></label>
            <label>Peças<textarea rows={4} value={form.pecas} onChange={e=>setForm(v=>({...v,pecas:e.target.value}))} placeholder="Peças e quantidades"/></label>
            <label>Produto<input value={form.produto} onChange={e=>setForm(v=>({...v,produto:e.target.value}))} placeholder="Nome do produto"/></label>
            <label>Valor do produto (R$)<input type="number" min="0" step="0.01" value={form.valor_produto} onChange={e=>setForm(v=>({...v,valor_produto:e.target.value}))} placeholder="0,00"/></label>
            <label>Valor (R$)<input type="number" min="0" step="0.01" value={form.valor} onChange={e=>setForm(v=>({...v,valor:e.target.value}))}/></label>
            <label>Forma de pagamento<select value={form.forma_pagamento} onChange={e=>setForm(v=>({...v,forma_pagamento:e.target.value}))}>
              <option value="">Selecione</option><option>Pix</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Boleto</option><option>Ticklog</option><option>Faturado</option><option>Transferência bancária</option><option>Outro</option>
            </select></label>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Salvar OS'}</button>
            <button type="button" onClick={()=>{if(!form.numero_os.trim()||!form.empresa_id){setMensagem("Informe o número da OS e selecione um cliente para gerar o pedido.");return} imprimirPedido({...form,numero_os:form.numero_os.trim(),valor:Number(String(form.valor).replace(",","."))||0,valor_produto:Number(String(form.valor_produto).replace(",","."))||0})}} style={{background:"#555b63",color:"#fff",border:"1px solid #737b83",borderRadius:8,padding:"10px 16px",cursor:"pointer"}}>Imprimir / Salvar PDF</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio);setBusca('')}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>OS cadastradas <button type="button" onClick={atualizarOS}>Atualizar</button></h2>
        <div className="form-grid" style={{marginBottom:14}}>
          <label>Buscar por número da OS<input value={filtroNumeroOS} onChange={e=>setFiltroNumeroOS(e.target.value)} placeholder="Ex.: 267" /></label>
          <label>Filtrar por mês<input type="month" value={filtroMesOS} onChange={e=>setFiltroMesOS(e.target.value)} /></label>
        </div>
        {(filtroMesOS || filtroNumeroOS) && <button type="button" onClick={()=>{setFiltroMesOS('');setFiltroNumeroOS('')}} style={{marginBottom:12}}>Limpar filtros</button>}
        {carregandoOS?<p>Carregando...</p>:<table><thead><tr><th>OS</th><th>Cliente</th><th>Serviços</th><th>Peças</th><th>Produto</th><th>Valor do produto</th><th>Valor</th><th>Pagamento</th><th>Ações</th></tr></thead>
          <tbody>{registrosFiltrados.map(item=>{const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id));return <tr key={item.id}>
            <td>{item.numero_os}</td><td>{cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'Cliente cadastrado'}</td>
            <td>{item.servicos}</td><td>{item.pecas}</td><td>{item.produto||'—'}</td><td>{dinheiro(item.valor_produto)}</td><td>{dinheiro(item.valor)}</td><td>{item.forma_pagamento}</td>
            <td><button type="button" onClick={()=>editar(item)}>Editar</button> <button type="button" onClick={()=>imprimirPedido(item)}>Pedido / PDF / Imprimir</button></td>
          </tr>})}{!registrosFiltrados.length&&<tr><td colSpan={9}>Nenhuma OS encontrada para os filtros selecionados.</td></tr>}</tbody></table>}
      </section>
    </>
  }


  function Catalogo() {
    const vazio = {tipo:'Produto',nome:'',preco:'',custo:'',preco_manual:false,quantidade_caixa:'10',quantidade_estoque:'',fornecedor:''}
    const [form,setForm] = useState(vazio)
    const [registros,setRegistros] = useState([])
    const [editando,setEditando] = useState(null)
    const [busca,setBusca] = useState('')
    const [tipoFiltro,setTipoFiltro] = useState('Todos')
    const [salvando,setSalvando] = useState(false)
    const [excluindo,setExcluindo] = useState(null)
    const [carregando,setCarregando] = useState(false)
    const [mensagem,setMensagem] = useState('')
    async function carregar() {
      setCarregando(true)
      const {data,error}=await supabase.from('catalogo_itens').select('*').order('nome',{ascending:true})
      setCarregando(false)
      if(error){setMensagem('Erro ao consultar cadastro: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{carregar()},[])
    async function salvar(e) {
      e.preventDefault()
      setSalvando(true);setMensagem('')
      const payload={
        tipo:form.tipo,nome:form.nome.trim(),
        preco:Number(String(form.preco).replace(',','.'))||0,
        custo:Number(String(form.custo).replace(',','.'))||0,
        quantidade_caixa:form.tipo==='Produto'?Math.max(1,Number(form.quantidade_caixa)||1):1,
        quantidade_estoque:form.tipo==='Produto'?Math.max(0,Number(form.quantidade_estoque)||0):0,
        fornecedor:form.fornecedor.trim()
      }
      const {error}=editando
        ?await supabase.from('catalogo_itens').update(payload).eq('id',editando)
        :await supabase.from('catalogo_itens').insert([payload])
      setSalvando(false)
      if(error){setMensagem('Não foi possível salvar: '+error.message);return}
      setForm(vazio);setEditando(null);setMensagem('Cadastro salvo com sucesso.');await carregar()
    }
    async function excluir(item) {
      if(!window.confirm('Excluir definitivamente "'+item.nome+'" do cadastro de produtos e serviços?'))return
      setExcluindo(item.id);setMensagem('')
      const {error}=await supabase.from('catalogo_itens').delete().eq('id',item.id)
      setExcluindo(null)
      if(error){setMensagem('Não foi possível excluir: '+error.message);return}
      if(String(editando)===String(item.id)){setEditando(null);setForm(vazio)}
      setMensagem('Cadastro excluído com sucesso.')
      await carregar()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({tipo:item.tipo||'Produto',nome:item.nome||'',preco:String(item.preco??''),custo:String(item.custo??''),preco_manual:true,quantidade_caixa:String(item.quantidade_caixa??10),quantidade_estoque:String(item.quantidade_estoque??0),fornecedor:item.fornecedor||''})
      window.scrollTo({top:0,behavior:'smooth'})
    }
    const filtrados=registros.filter(item=>(tipoFiltro==='Todos'||item.tipo===tipoFiltro)&&normalizarBusca([item.nome,item.fornecedor].join(' ')).includes(normalizarBusca(busca)))
    return <>
      <div className="page-title"><div><h1>Cadastro de Produtos e Serviços</h1><p>Catálogo de preços, fornecedores e quantidades da Central Truck.</p></div></div>
      <section className="panel" style={{marginBottom:18}}>
        <h2>Buscar produtos e serviços</h2>
        <div className="form-grid">
          <label>Pesquisar produto, serviço ou fornecedor<input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Digite o nome do produto ou serviço"/></label>
          <label>Mostrar<select value={tipoFiltro} onChange={e=>setTipoFiltro(e.target.value)}><option>Todos</option><option>Produto</option><option>Serviço</option></select></label>
        </div>
        <p style={{marginTop:10,fontSize:13}}>{filtrados.length} cadastro(s) encontrado(s). {busca||tipoFiltro!=='Todos'?'Veja os resultados na lista abaixo.':'Pesquise para localizar um item já cadastrado.'}</p>
        {(busca||tipoFiltro!=='Todos')&&<button type="button" onClick={()=>{setBusca('');setTipoFiltro('Todos')}}>Limpar busca</button>}
      </section>
      <section className="panel">
        <h2>{editando?'Editar cadastro':'Novo produto ou serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Tipo *<select value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))}><option>Produto</option><option>Serviço</option></select></label>
            <label>Nome / descrição *<input required value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))} placeholder="Ex.: Filtro ARLA ou Diagnóstico eletrônico"/></label>
            <label>Valor de custo (R$)<input type="number" min="0" step="0.01" value={form.custo} onChange={e=>setForm(v=>{const custo=e.target.value;const valor=Number(custo)||0;return {...v,custo,preco:v.preco_manual?v.preco:(custo===''?'':(Math.round(valor*1.7*100)/100).toFixed(2))}})} placeholder="0,00"/></label>
            <label>Valor de venda (R$) *<input required type="number" min="0" step="0.01" value={form.preco} onChange={e=>setForm(v=>({...v,preco:e.target.value,preco_manual:true}))} placeholder="Calculado com 70% sobre o custo"/></label>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',paddingBottom:10}}>
              <span style={{fontSize:12}}>Venda sugerida: custo + 70%. Você pode alterar o preço.</span>
              <button type="button" onClick={()=>setForm(v=>({...v,preco_manual:false,preco:v.custo===''?'':(Math.round((Number(v.custo)||0)*1.7*100)/100).toFixed(2)}))}>Aplicar +70%</button>
            </div>
            <label>Fornecedor<input value={form.fornecedor} onChange={e=>setForm(v=>({...v,fornecedor:e.target.value}))} placeholder="Nome do fornecedor"/></label>
            {form.tipo==='Produto' && <>
              <label>Unidades por caixa<input type="number" min="1" step="1" value={form.quantidade_caixa} onChange={e=>setForm(v=>({...v,quantidade_caixa:e.target.value}))} placeholder="10"/></label>
              <label>Quantidade em estoque (unidades)<input type="number" min="0" step="1" value={form.quantidade_estoque} onChange={e=>setForm(v=>({...v,quantidade_estoque:e.target.value}))} placeholder="0"/></label>
            </>}
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Cadastrar'}</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio)}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>Produtos e serviços cadastrados <button type="button" onClick={carregar}>Atualizar</button></h2>

        {carregando?<p>Carregando...</p>:<table><thead><tr><th>Tipo</th><th>Produto / Serviço</th><th>Custo</th><th>Venda</th><th>Unid. / caixa</th><th>Estoque</th><th>Fornecedor</th><th>Ações</th></tr></thead><tbody>
          {filtrados.map(item=><tr key={item.id}><td>{item.tipo}</td><td>{item.nome}</td><td>{dinheiro(item.custo)}</td><td>{dinheiro(item.preco)}</td><td>{item.tipo==='Produto'?item.quantidade_caixa:'—'}</td><td>{item.tipo==='Produto'?item.quantidade_estoque:'—'}</td><td>{item.fornecedor||'—'}</td><td><div className="actions"><button type="button" className="btn-editar" onClick={()=>editar(item)}>Editar</button><button type="button" className="btn-excluir" disabled={excluindo===item.id} onClick={()=>excluir(item)}>{excluindo===item.id?"Excluindo...":"Excluir"}</button></div></td></tr>)}
          {!filtrados.length&&<tr><td colSpan={8}>Nenhum cadastro encontrado.</td></tr>}
        </tbody></table>}
      </section>
    </>
  }

  function Conteudo() {
    if (pagina === 'dashboard') return <Dashboard />
    if (pagina === 'empresas') return <Empresas />
    if (pagina === 'funil') return <Funil />
    if (pagina === 'oportunidades') return <Oportunidades />
    if (pagina === 'atendimentos') return <Atendimentos />
    if (pagina === 'agenda') return <Agenda />
    if (pagina === 'orcamentos') return <Orcamentos />
    if (pagina === 'ordens-servico') return <OrdensServico />
    if (pagina === 'catalogo') return <Catalogo />
    if (pagina === 'relatorios') return <Relatorios />
    if (pagina === 'importar') return <ImportarContatos />
    if (pagina === 'configuracoes') return <Configuracoes />
    return <Dashboard />
  }

  return (
    <div className="crm">
      <aside className="sidebar">
        <div className="brand">
          <a href="#" aria-label="Ir para o Dashboard" title="Voltar ao Dashboard" onClick={(event) => { event.preventDefault(); setPagina("dashboard") }} style={{ display: "inline-flex", cursor: "pointer" }}>
            <LogoMark className="brand-logo" />
          </a>
        </div>

        <nav>
          {MENU.map(([id, icone, nome]) => (
            <button
              key={id}
              className={pagina === id ? 'active' : ''}
              onClick={() => setPagina(id)}
            >
              <span>{icone}</span>
              {nome}
            </button>
          ))}
          <button type="button" className="logout-btn" onClick={sair} style={{ width: "100%", marginTop: "12px", textAlign: "left" }}>⇥&nbsp; Sair</button>
        </nav>

        <div className="sidebar-footer">
          <div className="online-dot"></div>
          <div>
            <b>Central Truck</b>
            <span>Sistema online</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="reference-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"24px",flexWrap:"nowrap",position:"relative",width:"100%",boxSizing:"border-box"}}>
          <div className="reference-brand" style={{flex:"0 1 auto",minWidth:0}}>
            <div className="reference-brand-name" style={{fontSize:"clamp(20px, 2.5vw, 34px)",fontWeight:900,letterSpacing:"0.015em",lineHeight:1.05,whiteSpace:"nowrap"}}>CENTRAL TRUCK <span style={{fontSize:"0.46em",letterSpacing:"0.12em",verticalAlign:"middle",whiteSpace:"nowrap"}}>★ SERVICE ★</span></div>
          </div>
          <a className="commercial-phone reference-whatsapp" style={{position:"absolute",right:"18px",top:"50%",transform:"translateY(-50%)",margin:0,flexShrink:0,display:"flex",alignItems:"center",gap:"10px"}} href="https://wa.me/5531975255079" target="_blank" rel="noreferrer">
            <img className="whatsapp-logo-img" src={ZAP_LOGO} alt="WhatsApp" />
            <span className="commercial-copy"><strong>(31) 97525-5079</strong></span>
          </a>
        </header>

        <div className="content">
          {erro && (
            <div className="error-box">
              <b>Não foi possível acessar os dados do Supabase.</b>
              <span>{erro}</span>
              <button onClick={carregarDados}>Tentar novamente</button>
            </div>
          )}

          {carregando ? (
            <div className="loading">
              <div className="loader"></div>
              <b>Carregando Central Truck CRM...</b>
              <span>Buscando informações do banco de dados.</span>
            </div>
          ) : (
            <Conteudo />
          )}
        </div>
      </main>
    </div>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento #root não encontrado no index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
,'Valor em Oportunidades', dinheiro(valorOportunidades)],
      ['↗','Valor Vendido', dinheiro(valorVendido)],
      ['%','Conversão', `${conversao}%`],
      ['◷','Retornos Atrasados', atrasadas],
    ]
    return (
      <div className="dashboard-premium">
        <section className="dash-hero">
          <div>
            <small>Central Truck Service</small>
            <h1>Dashboard Comercial</h1>
            <p>Visão geral da operação comercial Truck exclusivo Danielle</p>
            <button className="primary" onClick={carregarDados}>↻ Atualizar dados</button>
          </div>
          <div className="hero-watermark hero-driving-scene"><img className="hero-truck-image" src={`${import.meta.env.BASE_URL}Caminhão Volvo FH 540 no Galpão Industrial.png`} alt="Volvo FH 540 em movimento" /><span className="truck-motion-streak streak-one" aria-hidden="true"></span><span className="truck-motion-streak streak-two" aria-hidden="true"></span><span className="truck-motion-streak streak-three" aria-hidden="true"></span></div>
        </section>

        <section className="kpi-grid">
          {kpis.map(([icone,titulo,valor]) => (
            <div className="kpi-card clickable-card" key={titulo} role="button" tabIndex="0" onClick={() => { const destinos={'Total de Leads':'empresas','Em Negociação':'funil','Vendas Realizadas':'orcamentos','Vendas nos Últimos 30 Dias':'orcamentos','Valor Vendido nos Últimos 30 Dias':'orcamentos','Valor em Oportunidades':'orcamentos','Valor Vendido':'orcamentos','Conversão':'relatorios','Retornos Atrasados':'agenda'}; setPagina(destinos[titulo] || 'dashboard') }} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')e.currentTarget.click()}}>
              <div className="kpi-icon">{icone}</div>
              <span>{titulo}</span>
              <strong>{valor}</strong>
              <small><b>Central Truck</b> · atualizado</small>
            </div>
          ))}
        </section>

        <div className="dashboard-lower">
          <section className="panel strategic-panel clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('oportunidades')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('oportunidades')}}>
            <div className="panel-heading"><div><h2>Serviços Estratégicos</h2><p>Principais soluções oferecidas pela Central Truck.</p></div></div>
            <div className="service-premium-grid">
              <img
                className="strategic-services-image"
                src={`${import.meta.env.BASE_URL}servicos-estrategicos.jpg`}
                alt="Serviços Estratégicos da Central Truck"
              />
            </div>
          </section>
          <section className="panel commercial-chart clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('relatorios')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('relatorios')}}>
            <div className="panel-heading"><div><h2>Resumo Comercial</h2><p>Evolução das vendas e oportunidades.</p></div></div>
            <div className="mini-bars">
              <div><span>Leads</span><i style={{height:`${Math.min(100,Math.max(8,empresas.length*12))}%`}}></i><b>{empresas.length}</b></div>
              <div><span>Oportunidades</span><i style={{height:`${Math.min(100,Math.max(8,oportunidades.length*16))}%`}}></i><b>{oportunidades.length}</b></div>
              <div><span>Vendas finalizadas</span><i style={{height:`${Math.min(100,Math.max(8,vendas.length*22))}%`}}></i><b>{vendas.length}</b></div>
              <div><span>Orçamentos</span><i style={{height:`${Math.min(100,Math.max(8,orcamentos.length*18))}%`}}></i><b>{orcamentos.length}</b></div>
            </div>
          </section>
        </div>

        <div className="dashboard-lower">
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Últimos Leads</h2><p>Empresas cadastradas recentemente.</p></div><button onClick={()=>setPagina('empresas')}>Ver todos →</button></div>
            {ultimosLeads.length ? ultimosLeads.map((e)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={e.id} onClick={()=>setPagina('empresas')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('empresas')}}><span className="list-avatar">{(e.nome_fantasia||e.nome||'C')[0]}</span><div><b>{e.nome_fantasia||e.nome}</b><small>{e.status||'Lead novo'}</small></div><em>{e.classificacao||'B'}</em></div>) : <div className="dash-empty">Nenhum lead cadastrado.</div>}
          </section>
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Agenda vinculada</h2><p>{tarefas.length} tarefa(s) cadastrada(s) • {proximasTarefas.length} próxima(s) exibida(s).</p></div><button onClick={()=>setPagina('agenda')}>Ver agenda →</button></div>
            {proximasTarefas.length ? proximasTarefas.map((t)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={t.id} onClick={()=>setPagina('agenda')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('agenda')}}><span className="list-avatar">◷</span><div><b>{t.titulo}</b><small>{nomeEmpresa(t.empresa_id)} · {dataBR(t.data_hora)}</small></div><em>{t.prioridade||'Normal'}</em></div>) : <div className="dash-empty">Nenhuma tarefa encontrada no banco de dados. Abra a Agenda para cadastrar ou atualizar.</div>}
          </section>
        </div>
      </div>
    )
  }

 async function baixarPlanilhaClientes() {
  if (!empresas.length) { alert('Não há clientes cadastrados para baixar.'); return }

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Central Truck Service'
  workbook.created = new Date()
  const ws = workbook.addWorksheet('Clientes', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
    },
    views: [{ state: 'frozen', ySplit: 6 }]
  })

  const colunas = [
    ['Empresa',28],['Nome fantasia',28],['CNPJ',20],['Classificação',14],
    ['Segmento',20],['Cidade',20],['Estado',10],['Telefone',18],
    ['WhatsApp',18],['E-mail',30],['Site',28],['Status',20],
    ['Data do cadastro',18],['Observações',40]
  ]
  ws.columns = colunas.map(([header,width]) => ({ header, width }))
  ws.spliceRows(1, 1)
  ws.mergeCells('A1:N3')
  ws.mergeCells('A4:N4')
  ws.mergeCells('A5:N5')
  ws.getCell('A1').value = 'CENTRAL TRUCK SERVICE'
  ws.getCell('A4').value = 'RELATÓRIO DE CLIENTES / LEADS'
  ws.getCell('A5').value = 'Gestão Comercial • Exportado em ' + new Date().toLocaleString('pt-BR')

  const verde = 'FF19E6A2', escuro = 'FF061914', escuro2 = 'FF0B2A21', branco = 'FFFFFFFF', cinza = 'FFDCE9E4'
  ;['A1','A4','A5'].forEach((ref) => {
    ws.getCell(ref).alignment = { vertical:'middle', horizontal:'center' }
    ws.getCell(ref).fill = { type:'pattern', pattern:'solid', fgColor:{argb:escuro} }
    ws.getCell(ref).font = { color:{argb: ref==='A4' ? verde : branco}, bold:true, size: ref==='A1' ? 24 : ref==='A4' ? 16 : 10 }
  })
  ws.getRow(1).height = 32; ws.getRow(2).height = 18; ws.getRow(3).height = 18
  ws.getRow(4).height = 26; ws.getRow(5).height = 22

  const headerRow = ws.getRow(6)
  colunas.forEach(([titulo],i) => headerRow.getCell(i+1).value = titulo)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:verde} }
    cell.font = { color:{argb:'FF00140E'}, bold:true, size:10 }
    cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true }
    cell.border = { bottom:{style:'medium',color:{argb:'FF00A875'}} }
  })

  empresas.forEach((empresa,idx) => {
    const row = ws.addRow([
      empresa.nome || '', empresa.nome_fantasia || '', empresa.cnpj || '',
      empresa.classificacao || '', empresa.segmento || '', empresa.cidade || '',
      empresa.estado || '', empresa.telefone || '', empresa.whatsapp || '',
      empresa.email || '', empresa.site || '', empresa.status || '',
      dataBR(empresa.criado_em), empresa.observacoes || ''
    ])
    row.height = 24
    row.eachCell({includeEmpty:true}, (cell) => {
      cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb: idx%2===0 ? 'FFF5FAF8' : branco} }
      cell.font = { color:{argb:'FF17352C'}, size:10 }
      cell.alignment = { vertical:'middle', wrapText:true }
      cell.border = { bottom:{style:'thin',color:{argb:cinza}} }
    })
  })

  ws.autoFilter = { from:'A6', to:'N' + (empresas.length + 6) }
  ws.headerFooter.oddHeader = '&C&B CENTRAL TRUCK SERVICE'
  ws.headerFooter.oddFooter = '&LRelatório de Clientes&CConfidencial&R&P de &N'
  ws.pageSetup.printTitlesRow = '1:6'
  ws.pageSetup.printArea = 'A1:N' + (empresas.length + 6)

  try {
    const resposta = await fetch(LOGO)
    const blob = await resposta.blob()
    const base64 = await new Promise((resolve,reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const ext = blob.type.includes('png') ? 'png' : 'jpeg'
    const logoId = workbook.addImage({ base64, extension:ext })
    ws.addImage(logoId, { tl:{col:0.15,row:0.15}, ext:{width:125,height:72}, editAs:'oneCell' })
  } catch (e) { console.warn('Logo não inserida no Excel:', e) }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'Clientes_Central_Truck_' + new Date().toISOString().slice(0,10) + '.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

function Empresas() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const formularioEmpresaRef = React.useRef(null)
  const [salvando, setSalvando] = useState(false)
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
   const [empresaEditando, setEmpresaEditando] = useState(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState([])
  const [buscaEmpresa, setBuscaEmpresa] = useState('')
  const [filtroStatusEmpresa, setFiltroStatusEmpresa] = useState('')
  const [buscaAgenda, setBuscaAgenda] = useState('')
  const [form, setForm] = useState({
    nome: '',
    nome_fantasia: '',
    pessoa_contato: '',
    cnpj: '',
    segmento: '',
    classificacao: 'B',
    status: 'Lead novo',
    cidade: '',
    estado: 'MG',
    telefone: '',
    whatsapp: '',
    email: '',
    site: '',
    observacoes: ''
  })

  function limparCadastro() {
    sessionStorage.removeItem('empresa_rascunho')
    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    setEmpresaEditando(null)
    setForm({
      nome: '', nome_fantasia: '', pessoa_contato: '', cnpj: '',
      segmento: '', classificacao: 'B', status: 'Lead novo',
      cidade: '', estado: 'MG', telefone: '', whatsapp: '',
      email: '', site: '', observacoes: ''
    })
  }

  useEffect(() => {
    const rascunho = sessionStorage.getItem('centraltruck_empresa_em_edicao')
    if (rascunho) {
      try {
        const dados = JSON.parse(rascunho)
        if (dados && typeof dados === 'object') {
          setForm(dados)
          setMostrarFormulario(true)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (mostrarFormulario && !empresaEditando && form.nome.trim()) {
      sessionStorage.setItem('centraltruck_empresa_em_edicao', JSON.stringify(form))
    }
  }, [form, mostrarFormulario, empresaEditando])

  function alterarCampo(e) {
    const { name, value } = e.target
    setForm((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }
function editarEmpresa(empresa) {
  setEmpresaEditando(empresa)

  setForm({
    nome: empresa.nome || '',
    nome_fantasia: empresa.nome_fantasia || '',
    pessoa_contato: empresa.pessoa_contato || '',
    cnpj: empresa.cnpj || '',
    segmento: empresa.segmento === 'Diesel' ? 'Oficina - Diesel' : (empresa.segmento || ''),
    classificacao: empresa.classificacao || 'B',
    status: empresa.status || 'Lead novo',
    cidade: empresa.cidade || '',
    estado: empresa.estado || 'MG',
    telefone: empresa.telefone || '',
    whatsapp: empresa.whatsapp || '',
    email: empresa.email || '',
    site: empresa.site || '',
    observacoes: empresa.observacoes || ''
  })

  setMensagem('')
  setMostrarFormulario(true)
  requestAnimationFrame(() => {
    formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
async function excluirSelecionados() {
  if (!leadsSelecionados.length) {
    alert('Selecione pelo menos um Lead.')
    return
  }
  if (!window.confirm('Excluir os ' + leadsSelecionados.length + ' Leads selecionados?')) return

  const lote = 100
  for (let inicio = 0; inicio < leadsSelecionados.length; inicio += lote) {
    const ids = leadsSelecionados.slice(inicio, inicio + lote)

    const funil = await supabase.from('oportunidades').delete().in('empresa_id', ids)
    if (funil.error) {
      alert('Erro ao limpar os vínculos do Funil: ' + funil.error.message)
      await carregarDados()
      return
    }

    const resultado = await supabase.from('empresas').delete().in('id', ids)
    if (resultado.error) {
      alert('Erro ao excluir os Leads selecionados: ' + resultado.error.message)
      await carregarDados()
      return
    }
  }

  setLeadsSelecionados([])
  await carregarDados()
  alert('Leads selecionados excluídos com sucesso.')
}

async function excluirEmpresa(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir esta empresa? Esta ação não poderá ser desfeita.'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('Erro ao excluir empresa: ' + error.message)
    return
  }

  await carregarDados()
}
  async function salvarEmpresa(e) {
    e.preventDefault()

    if (!form.nome.trim()) {
      setMensagem('Informe o nome da empresa.')
      return
    }

    setSalvando(true)
    setMensagem('')

    const { pessoa_contato, ...camposBanco } = form
    const dados = {
      ...camposBanco,
      nome: form.nome.trim(),
      nome_fantasia: form.nome_fantasia.trim() || null,
      cnpj: form.cnpj.trim() || null,
      segmento: form.segmento.trim() || null,
      cidade: form.cidade.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      observacoes: form.observacoes.trim() || null
    }

    let resultado

if (empresaEditando) {
  resultado = await supabase
    .from('empresas')
    .update(dados)
    .eq('id', empresaEditando.id)
} else {
  resultado = await supabase
    .from('empresas')
    .insert([dados])
    .select('id')
}

const { error } = resultado


    if (error) {
      console.error(error)
      setMensagem('Erro ao cadastrar empresa: ' + error.message)
      setSalvando(false)
      return
    }

    setMensagem(empresaEditando ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!')
    sessionStorage.removeItem('empresa_rascunho')

    setForm({
      nome: '',
      nome_fantasia: '',
      pessoa_contato: '',
      cnpj: '',
      segmento: '',
      classificacao: 'B',
      status: 'Lead novo',
      cidade: '',
      estado: 'MG',
      telefone: '',
      whatsapp: '',
      email: '',
      site: '',
      observacoes: ''
    })

    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    await carregarDados()
    setSalvando(false)
    setEmpresaEditando(null)
    // Manter o formulario aberto e limpo para o proximo cadastro.
    setMostrarFormulario(true)
    requestAnimationFrame(() => {
      formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Empresas / Leads</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.4' }}>Base comercial de clientes e potenciais clientes.</p>
        </div>

        <button
          className="primary"
          onClick={() => {
            setMensagem('')
            if (mostrarFormulario) {
              setMostrarFormulario(false)
              limparCadastro()
            } else {
              limparCadastro()
              setMostrarFormulario(true)
            }
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nova Empresa'}
        </button>
        <button type="button" className="btn-exportar" onClick={baixarPlanilhaClientes}>
          ↓ Baixar planilha de clientes
        </button>
      </div>

      {mensagem && (
        <section className="panel" style={{ marginBottom: '16px' }}>
          <strong>{mensagem}</strong>
        </section>
      )}

      {mostrarFormulario && (
        <section ref={formularioEmpresaRef} className="panel" style={{ marginBottom: '20px', scrollMarginTop: '24px' }}>
          <h2>{empresaEditando ? 'Editar Empresa' : 'Nova Empresa'}</h2>

          <form onSubmit={salvarEmpresa}>
            <div className="form-grid">
              <label>
                Nome da empresa *
                <input
                  name="nome"
                  value={form.nome}
                  onChange={alterarCampo}
                  required
                />
              </label>

              <label>
                Pessoa de contato
                <input
                  name="pessoa_contato"
                  value={form.pessoa_contato}
                  onChange={alterarCampo}
                  placeholder="Ex.: Gustavo"
                />
              </label>

              <label>
                CNPJ
                <input
                  name="cnpj"
                  value={form.cnpj}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Segmento
                <select
                  name="segmento"
                  value={form.segmento}
                  onChange={alterarCampo}
                >
                  <option value="">Selecione o segmento</option>
                  <option value="Transportadora">Transportadora</option>
                  <option value="Frota Própria">Frota Própria</option>
                  <option value="Frota Terceirizada">Frota Terceirizada</option>
                  <option value="Troca de Óleo">Troca de Óleo</option>
                  <option value="Oficina - Diesel">Oficina - Diesel</option>
                  <option value="Elétrica">Elétrica</option>
                  <option value="Pessoa Física">Pessoa Física</option>
                </select>
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={alterarCampo}
                >
                  <option>Lead novo</option>
                  <option>Primeiro contato</option>
                  <option>Interessado</option>
                  <option>Visita agendada</option>
                  <option>Orçamento enviado</option>
                  <option>Em negociação</option>
                  <option>Venda realizada</option>
                  <option>Venda perdida</option>
                  <option>Pós-venda</option>
                  <option>Já é cliente</option>
                  <option>Concorrente</option>
                  <option>Futuro parceiro</option>
                  <option>Não atendeu, ligar novamente</option>
                  <option>Cliente de outro vendedor</option>
                  </select>
              </label>

              <label>
                Cidade
                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Estado
                <input
                  name="estado"
                  value={form.estado}
                  onChange={alterarCampo}
                  maxLength="2"
                />
              </label>

              <label>
                Telefone
                <input
                  name="telefone"
                  value={form.telefone}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                WhatsApp
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={alterarCampo}
                />
              </label>
            </div>

            <label style={{ display: 'block', marginTop: '14px' }}>
              Observações
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={alterarCampo}
                rows="4"
              />
            </label>

            <div style={{ marginTop: '12px', color: 'var(--muted)', fontSize: '13px' }}>Após salvar, você poderá selecionar esta empresa na seção “Agendar novo contato” abaixo.</div>
            <div style={{ marginTop: '16px' }}>
              <button
                className="primary"
                type="submit"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Empresa'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel" style={{ marginBottom: '16px' }}>
        <h3>Agendar novo contato</h3>
        <p>Selecione uma empresa cadastrada para criar um retorno diretamente na Agenda.</p>
        <input aria-label="Buscar empresa para agendar" placeholder="🔎 Buscar empresa pelo nome..." value={buscaAgenda} onChange={e => setBuscaAgenda(e.target.value)} style={{width:'100%',maxWidth:'480px',marginBottom:'8px'}} />
        <select id="empresa-agenda-rapida" defaultValue="" style={{ width: '100%', maxWidth: '480px', marginRight: '12px' }}>
          <option value="">Selecione uma empresa</option>
          {empresas.filter(empresa => normalizarBusca(empresa.nome_fantasia || empresa.nome).includes(normalizarBusca(buscaAgenda))).map(empresa => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia || empresa.nome}</option>)}
        </select>
        <button type="button" className="primary" style={{ background: '#444B54', backgroundColor: '#444B54', color: '#FFFFFF', border: '1px solid #626A74' }} onClick={() => {
          const id = document.getElementById('empresa-agenda-rapida')?.value
          if (!id) { alert('Selecione uma empresa antes de agendar.'); return }
          sessionStorage.setItem('centraltruck_agendar_empresa', id)
          setPagina('agenda')
        }}>+ Agendar novo contato</button>
      </section>

      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px'}}>
        <input aria-label="Buscar na lista de empresas" placeholder="🔎 Buscar cliente, telefone, cidade ou observações..." value={buscaEmpresa} onChange={e => setBuscaEmpresa(e.target.value)} style={{flex:'2 1 320px',minWidth:0}} />
        <select aria-label="Filtrar clientes por situação" value={filtroStatusEmpresa} onChange={e => setFiltroStatusEmpresa(e.target.value)} style={{flex:'1 1 220px',minWidth:0}}>
          <option value="">Todas as situações</option>
          <option value="Não atendeu, ligar novamente">Não atendeu / ligar novamente</option>
          {[...new Set(empresas.map(e => e.status).filter(Boolean))].filter(status => status !== 'Não atendeu, ligar novamente').sort((a,b)=>a.localeCompare(b,'pt-BR')).map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        {(buscaEmpresa || filtroStatusEmpresa) && <button type="button" onClick={()=>{setBuscaEmpresa('');setFiltroStatusEmpresa('')}}>Limpar filtros</button>}
      </div>
      <section className="panel table-wrap">
        {leadsSelecionados.length > 0 && (
          <div className="selection-toolbar">
            <strong>{leadsSelecionados.length} selecionado(s)</strong>
            <button type="button" className="btn-excluir" onClick={excluirSelecionados}>Excluir selecionados</button>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th className="select-col"><input type="checkbox" aria-label="Selecionar todos" checked={empresas.length > 0 && leadsSelecionados.length === empresas.length} onChange={(e)=>setLeadsSelecionados(e.target.checked ? empresas.map((item)=>item.id) : [])} /></th>
              <th>Empresa</th>
              <th>Segmento</th>
              <th>Cidade</th>
              <th>Telefone</th>
              <th>Status</th><th>Data do cadastro</th><th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {empresas.length > 0 ? (
              empresas.filter(empresa => (!filtroStatusEmpresa || empresa.status === filtroStatusEmpresa) && normalizarBusca([empresa.nome, empresa.nome_fantasia, empresa.telefone, empresa.whatsapp, empresa.cidade, empresa.segmento, empresa.status, empresa.pessoa_contato, empresa.observacoes].join(' ')).includes(normalizarBusca(buscaEmpresa))).map((empresa) => (
                <tr key={empresa.id}>
                  <td className="select-col"><input type="checkbox" aria-label={'Selecionar ' + (empresa.nome_fantasia || empresa.nome)} checked={leadsSelecionados.includes(empresa.id)} onChange={(e)=>setLeadsSelecionados((atuais)=>e.target.checked ? [...atuais, empresa.id] : atuais.filter((id)=>id !== empresa.id))} /></td>
                  <td>{empresa.nome}</td>
                  <td>{empresa.segmento || '-'}</td>
                  <td>
                    {empresa.cidade || '-'}
                    {empresa.estado ? ` / ${empresa.estado}` : ''}
                  </td>
                  <td>{empresa.telefone || empresa.whatsapp || '-'}</td>
                 <td>{empresa.status || '-'}</td>
<td>{dataBR(empresa.criado_em)}</td>
<td>
 
  <button
    type="button"
    onClick={() => editarEmpresa(empresa)}
    className="btn-editar"
  >
    Editar
  </button>

  <button
    type="button"
    onClick={() => excluirEmpresa(empresa.id)}
    className="btn-excluir"
  >
    Excluir
  </button>
</td>
                </tr>
              ))
            ) : (
              <tr>
<td colSpan="8" style={{ textAlign: 'center' }}>                 
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}

function Decisores() {
  const [contatos, setContatos] = useState([])
const [empresas, setEmpresas] = useState([])
const [mostrarFormDecisor, setMostrarFormDecisor] = useState(false)
const [salvandoDecisor, setSalvandoDecisor] = useState(false)
const [mensagemDecisor, setMensagemDecisor] = useState('')
    const [decisorEditandoId, setDecisorEditandoId] = useState(null)

const [formDecisor, setFormDecisor] = useState({
  empresa_id: '',
  nome: '',
  cargo: '',
  telefone: '',
  whatsapp: '',
  email: ''
})

    async function carregarDecisores() {
    const { data, error } = await supabase
      .from('contatos')
      .select(`
        *,
        empresas (
          nome
        )
      `)
      .order('nome')

    if (error) {
      console.error('Erro ao carregar decisores:', error)
      return
    }

    setContatos(data || [])
  }

  async function carregarEmpresasDecisor() {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome')
      .order('nome')

    if (error) {
      console.error('Erro ao carregar empresas:', error)
      return
    }

    setEmpresas(data || [])
  }

  useEffect(() => {
    carregarDecisores()
    carregarEmpresasDecisor()
  }, [])
    async function salvarDecisor(e) {
    e.preventDefault()
    setSalvandoDecisor(true)
    setMensagemDecisor('')

    if (!formDecisor.empresa_id || !formDecisor.nome) {
      setMensagemDecisor('Selecione a empresa e informe o nome do decisor.')
      setSalvandoDecisor(false)
      return
    }

    const dadosDecisor = {
      empresa_id: formDecisor.empresa_id,
      nome: formDecisor.nome,
      cargo: formDecisor.cargo || null,
      telefone: formDecisor.telefone || null,
      whatsapp: formDecisor.whatsapp || null,
      email: formDecisor.email || null,
      principal: true
    }
    const consultaDecisor = decisorEditandoId
      ? supabase.from('contatos').update(dadosDecisor).eq('id', decisorEditandoId)
      : supabase.from('contatos').insert([dadosDecisor])
    const { error } = await consultaDecisor

    if (error) {
      console.error('Erro ao salvar decisor:', error)
alert('Erro ao salvar decisor: ' + error.message)
  setSalvandoDecisor(false)
      return
    }

    setFormDecisor({
      empresa_id: '',
      nome: '',
      cargo: '',
      telefone: '',
      whatsapp: '',
      email: ''
    })

    setMensagemDecisor(decisorEditandoId ? 'Decisor atualizado com sucesso!' : 'Decisor cadastrado com sucesso!')
    setDecisorEditandoId(null)
    setMostrarFormDecisor(false)
    setSalvandoDecisor(false)
    await carregarDecisores()
  }

  function editarDecisor(contato) {
    setFormDecisor({
      empresa_id: contato.empresa_id || '',
      nome: contato.nome || '',
      cargo: contato.cargo || '',
      telefone: contato.telefone || '',
      whatsapp: contato.whatsapp || '',
      email: contato.email || ''
    })
    setDecisorEditandoId(contato.id)
    setMostrarFormDecisor(true)
  }

  async function excluirDecisor(id) {
  const confirmar = window.confirm('Tem certeza que deseja excluir este decisor?')

  if (!confirmar) return

  const { error } = await supabase
    .from('contatos')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir decisor: ' + error.message)
    return
  }

  await carregarDecisores()
}
  
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Decisores</h1>
            <p>Contatos responsáveis pelas decisões comerciais.</p>
          </div>
          <button
  className="btn-primary"
  onClick={() => { setDecisorEditandoId(null); setFormDecisor({ empresa_id:'', nome:'', cargo:'', telefone:'', whatsapp:'', email:'' }); setMostrarFormDecisor(true) }}
>
  + Novo Decisor
</button>
        </div>

        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Cargo</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>WhatsApp</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contatos.map((contato) => (
                <tr key={contato.id}>
                  <td><b>{contato.nome}</b></td>
                  <td>{nomeEmpresa(contato.empresa_id)}</td>
                  <td>{contato.cargo || '—'}</td>
                  <td>{contato.telefone || '—'}</td>
                  <td>{contato.email || '—'}</td>
                  <td>
                    {contato.whatsapp ? (
                      <a
                        className="whatsapp"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://wa.me/55${String(
                          contato.whatsapp
                        ).replace(/\D/g, '')}`}
                      >
                        Abrir WhatsApp
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                
        <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarDecisor(contato)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirDecisor(contato.id)}>Excluir</button></div></td>
  </tr>           
      ))}
              {!contatos.length && (
                <tr>
                  <td colSpan="7" className="empty">
                    Nenhum decisor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        {mostrarFormDecisor && (
  <section className="panel">
    <h2>{decisorEditandoId ? 'Editar Decisor' : 'Novo Decisor'}</h2>

<form onSubmit={salvarDecisor}>
  <label>Empresa</label>
      <select
        value={formDecisor.empresa_id}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, empresa_id: e.target.value })
        }
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome}
          </option>
        ))}
      </select>

      <label>Nome</label>
      <input
        type="text"
        value={formDecisor.nome}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, nome: e.target.value })
        }
      />

      <label>Cargo</label>
      <input
        type="text"
        value={formDecisor.cargo}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, cargo: e.target.value })
        }
      />

      <label>Telefone</label>
      <input
        type="text"
        value={formDecisor.telefone}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, telefone: e.target.value })
        }
      />

      <label>WhatsApp</label>
      <input
        type="text"
        value={formDecisor.whatsapp}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, whatsapp: e.target.value })
        }
      />

      <label>E-mail</label>
      <input
        type="email"
        value={formDecisor.email}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, email: e.target.value })
        }
      />

     <button type="submit" className="btn-primary" disabled={salvandoDecisor}>
{salvandoDecisor ? 'Salvando...' : 'Salvar Decisor'}
     </button>

      <button
        type="button"
        onClick={() => setMostrarFormDecisor(false)}
      >
        Cancelar
      </button>
    </form>
  </section>
)}
      </>
    )
  }

  async function excluirOportunidade(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta oportunidade?')) return
    const { error } = await supabase.from('oportunidades').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir oportunidade: ' + error.message)
      return
    }
    await carregarDados()
  }

  function Funil() {
    const [agendamentosFunil, setAgendamentosFunil] = useState({})

    async function agendarEEnviarWhatsApp(item) {
      const dataHora = agendamentosFunil[item.id]
      if (!dataHora) {
        alert('Selecione a data e a hora do agendamento.')
        return
      }

      const empresaNome = nomeEmpresa(item.empresa_id)
      const dataFormatada = new Date(dataHora).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })

      const { error } = await supabase.from('tarefas').insert([{
        empresa_id: item.empresa_id || null,
        titulo: 'Agendamento - ' + (item.titulo || empresaNome),
        descricao: 'Agendamento criado pelo Funil Comercial. Etapa: ' + item.etapa,
        data_hora: dataHora,
        prioridade: 'Normal',
        status: 'Pendente'
      }])

      if (error) {
        alert('Erro ao salvar o agendamento: ' + error.message)
        return
      }

      await carregarDados()

      const mensagem = [
        '📅 *AGENDAMENTO CENTRAL TRUCK*',
        '',
        'Empresa: ' + empresaNome,
        'Oportunidade: ' + (item.titulo || '-'),
        'Etapa: ' + item.etapa,
        'Data e hora: ' + dataFormatada
      ].join('\n')

      window.open('https://wa.me/5531975255079?text=' + encodeURIComponent(mensagem), '_blank', 'noopener,noreferrer')
    }

    const etapas = [
      'Lead Novo',
      'Primeiro Contato',
      'Interessado',
      'Visita Agendada',
      'Orçamento Enviado',
      'Em Negociação',
      'Venda Realizada',
      'Venda Perdida',
      'Pós-venda',
    ]


    async function moverOportunidade(id, novaEtapa) {
  const { error } = await supabase
    .from('oportunidades')
    .update({ etapa: novaEtapa })
    .eq('id', id)

  if (error) {
    alert('Erro ao alterar etapa: ' + error.message)
    return
  }

  await carregarDados()
}
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Funil Comercial</h1>
            <p>Acompanhamento das oportunidades por etapa.</p>
          </div>
        </div>

        <div className="kanban">
          {etapas.map((etapa) => {
            const itens = oportunidades.filter((o) => o.etapa === etapa)

            return (
              <div className="kanban-column" key={etapa}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.outline = '2px solid #19df91' }}
                onDragLeave={(e) => { e.currentTarget.style.outline = '' }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.outline = ''
                  const id = e.dataTransfer.getData('text/plain')
                  const item = oportunidades.find(o => String(o.id) === id)
                  if (item && item.etapa !== etapa) moverOportunidade(item.id, etapa)
                }}>
                <div className="kanban-title">
                  <b>{etapa}</b>
                  <span>{itens.length}</span>
                </div>

                {itens.map((item) => (
                 <details className="deal" key={item.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(item.id)); e.dataTransfer.effectAllowed = "move" }} style={{padding:"10px 12px",minHeight:0,cursor:"grab"}}>
  <summary style={{cursor:"pointer",fontWeight:700,listStyle:"revert",overflowWrap:"anywhere"}}>{nomeEmpresa(item.empresa_id) || item.titulo}</summary>
  <div style={{display:"grid",gap:"8px",marginTop:"12px"}}>
  <b>{item.titulo || nomeEmpresa(item.empresa_id)}</b>
  <strong>{dinheiro(item.valor_estimado)}</strong>



  <label className="deal-schedule-label">
    Data e hora do agendamento
    <input
      className="deal-schedule-input"
      type="datetime-local"
      value={agendamentosFunil[item.id] || ''}
      onChange={(e) => setAgendamentosFunil({ ...agendamentosFunil, [item.id]: e.target.value })}
    />
  </label>
  <button type="button" className="btn-whatsapp" onClick={() => agendarEEnviarWhatsApp(item)}>
    Agendar e enviar no WhatsApp
  </button>
  <button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button>
</div>
</details>
                ))}

                {!itens.length && (
                  <div className="kanban-empty">Nenhuma oportunidade</div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  function Oportunidades() {
      const [mostrarFormOportunidade, setMostrarFormOportunidade] = useState(false)
  const [salvandoOportunidade, setSalvandoOportunidade] = useState(false)
  const [mensagemOportunidade, setMensagemOportunidade] = useState('')
  const [selecionadas, setSelecionadas] = useState([])
  const [excluindoLote, setExcluindoLote] = useState(false)
  async function excluirSelecionadas() {
    if (!selecionadas.length || excluindoLote) return
    if (!window.confirm('Excluir definitivamente ' + selecionadas.length + ' oportunidade(s) selecionada(s)? Os cadastros das empresas serão preservados.')) return
    setExcluindoLote(true)
    const {error} = await supabase.from('oportunidades').delete().in('id', selecionadas)
    setExcluindoLote(false)
    if (error) { alert('Não foi possível excluir: ' + error.message); return }
    setSelecionadas([])
    await carregarDados()
  }

  const [formOportunidade, setFormOportunidade] = useState({
    empresa_id: '',
    titulo: '',
    servico: '',
    etapa: 'Lead Novo',
    valor_estimado: '',
    probabilidade: 0,
    previsao_fechamento: '',
    observacoes: ''
  })

  async function salvarOportunidade(e) {
    e.preventDefault()

    if (!formOportunidade.empresa_id || !formOportunidade.titulo) {
      setMensagemOportunidade('Selecione a empresa e informe o título da oportunidade.')
      return
    }

    setSalvandoOportunidade(true)
    setMensagemOportunidade('')

    const { error } = await supabase
      .from('oportunidades')
      .insert([{
        empresa_id: formOportunidade.empresa_id,
        titulo: formOportunidade.titulo,
        servico: formOportunidade.servico || null,
        etapa: formOportunidade.etapa,
        valor_estimado: formOportunidade.valor_estimado
          ? Number(formOportunidade.valor_estimado)
          : null,
        probabilidade: Number(formOportunidade.probabilidade) || 0,
        previsao_fechamento: formOportunidade.previsao_fechamento || null,
        observacoes: formOportunidade.observacoes || null
      }])

    if (error) {
      alert('Erro ao salvar oportunidade: ' + error.message)
      setSalvandoOportunidade(false)
      return
    }

    setFormOportunidade({
      empresa_id: '',
      titulo: '',
      servico: '',
      etapa: 'Lead Novo',
      valor_estimado: '',
      probabilidade: 0,
      previsao_fechamento: '',
      observacoes: ''
    })

    setMensagemOportunidade('Oportunidade cadastrada com sucesso!')
    setMostrarFormOportunidade(false)
    setSalvandoOportunidade(false)

    await carregarDados()
  }
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Oportunidades</h1>
            <p>Negociações comerciais em andamento.</p>
          </div>
        </div>
<button
  type="button"
  className="btn-primary"
  onClick={() => setMostrarFormOportunidade(true)}
>
  + Nova Oportunidade
</button>
<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginTop:12,marginBottom:12}}>
  <button type="button" onClick={()=>setSelecionadas(oportunidades.map(o=>o.id))}>Selecionar todas</button>
  <button type="button" onClick={()=>setSelecionadas([])}>Limpar seleção</button>
  <button type="button" className="btn-excluir" disabled={!selecionadas.length || excluindoLote} onClick={excluirSelecionadas}>
    {excluindoLote ? 'Excluindo...' : 'Excluir selecionadas ('+selecionadas.length+')'}
  </button>
</div>

{mensagemOportunidade && (
  <p>{mensagemOportunidade}</p>
)}
        {mostrarFormOportunidade && (
  <section className="panel">
    <h2>Nova Oportunidade</h2>

    <form onSubmit={salvarOportunidade}>

      <label>Empresa</label>
      <select
        value={formOportunidade.empresa_id}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            empresa_id: e.target.value
          })
        }
        required
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome_fantasia || empresa.nome}
          </option>
        ))}
      </select>

      <label>Título da oportunidade</label>
      <input
        type="text"
        value={formOportunidade.titulo}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            titulo: e.target.value
          })
        }
        placeholder="Ex.: Manutenção sistema ARLA"
        required
      />

      <label>Serviço</label>
      <select
        value={formOportunidade.servico}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            servico: e.target.value
          })
        }
      >
        <option value="">Selecione</option>
        <option value="Catalisador">Catalisador</option>
        <option value="ARLA 32">ARLA 32</option>
        <option value="Diálise">Diálise</option>
        <option value="Diagnóstico">Diagnóstico</option>
        <option value="Sistema SCR">Sistema SCR</option>
        <option value="DPF">DPF</option>
        <option value="Injeção Diesel">Injeção Diesel</option>
        <option value="Elétrica">Elétrica</option>
        <option value="Mecânica Diesel">Mecânica Diesel</option>
      </select>

      <label>Etapa</label>
      <select
        value={formOportunidade.etapa}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            etapa: e.target.value
          })
        }
      >
        <option value="Lead Novo">Lead Novo</option>
        <option value="Primeiro Contato">Primeiro Contato</option>
        <option value="Interessado">Interessado</option>
        <option value="Visita Agendada">Visita Agendada</option>
        <option value="Orçamento Enviado">Orçamento Enviado</option>
        <option value="Em Negociação">Em Negociação</option>
        <option value="Venda Realizada">Venda Realizada</option>
        <option value="Venda Perdida">Venda Perdida</option>
        <option value="Pós-venda">Pós-venda</option>
                  <option value="Já é cliente">Já é cliente</option>
      </select>

      <label>Valor estimado (R$)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={formOportunidade.valor_estimado}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            valor_estimado: e.target.value
          })
        }
      />

      <label>Probabilidade (%)</label>
      <input
        type="number"
        min="0"
        max="100"
        value={formOportunidade.probabilidade}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            probabilidade: e.target.value
          })
        }
      />

      <label>Previsão de fechamento</label>
      <input
        type="date"
        value={formOportunidade.previsao_fechamento}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            previsao_fechamento: e.target.value
          })
        }
      />

      <label>Observações</label>
      <textarea
        value={formOportunidade.observacoes}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            observacoes: e.target.value
          })
        }
      />

      <div>
        <button
          type="submit"
          className="btn-primary"
          disabled={salvandoOportunidade}
        >
          {salvandoOportunidade ? 'Salvando...' : 'Salvar Oportunidade'}
        </button>

        <button
          type="button"
          onClick={() => setMostrarFormOportunidade(false)}
        >
          Cancelar
        </button>
      </div>

    </form>
  </section>
)}
        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Selecionar todas as oportunidades" checked={oportunidades.length>0 && oportunidades.every(o=>selecionadas.includes(o.id))} onChange={e=>setSelecionadas(e.target.checked?oportunidades.map(o=>o.id):[])} /></th>
                <th>Oportunidade</th>
                <th>Empresa</th>
                <th>Serviço</th>
                <th>Etapa</th>
                <th>Valor</th>
                <th>Probabilidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" aria-label={'Selecionar '+(item.titulo||'oportunidade')} checked={selecionadas.includes(item.id)} onChange={e=>setSelecionadas(v=>e.target.checked?[...v,item.id]:v.filter(id=>id!==item.id))}/></td>
                  <td><b>{item.titulo || 'Oportunidade'}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.servico || '—'}</td>
                  <td><span className="status">{item.etapa}</span></td>
                  <td>{dinheiro(item.valor_estimado)}</td>
                  <td>{item.probabilidade || 0}%</td>
                  <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarOportunidade(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button></div></td>
                </tr>
              ))}

              {!oportunidades.length && (
                <tr>
                  <td colSpan="8" className="empty">
                    Nenhuma oportunidade cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </>
    )
  }
function Atendimentos() {
  const [mostrarFormAtendimento, setMostrarFormAtendimento] = useState(false)
const [salvandoAtendimento, setSalvandoAtendimento] = useState(false)
const [mensagemAtendimento, setMensagemAtendimento] = useState('')
const [atendimentoEditandoId, setAtendimentoEditandoId] = useState(null)

const [formAtendimento, setFormAtendimento] = useState({
  empresa_id: '',
  tipo: 'Ligação',
  descricao: '',
  data_atividade: new Date().toISOString().slice(0, 10),
  proximo_retorno: '',
  concluido: false
})

function editarAtendimento(item) {
  setFormAtendimento({
    empresa_id: item.empresa_id || '',
    tipo: item.tipo || 'Ligação',
    descricao: item.descricao || '',
    data_atividade: item.data_atividade ? String(item.data_atividade).slice(0,10) : new Date().toISOString().slice(0,10),
    proximo_retorno: item.proximo_retorno ? String(item.proximo_retorno).slice(0,10) : '',
    concluido: !!item.concluido
  })
  setAtendimentoEditandoId(item.id)
  setMostrarFormAtendimento(true)
}

async function excluirAtendimento(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir este atendimento?'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('atividades')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir atendimento: ' + error.message)
    return
  }

  await carregarDados()
} 
  async function salvarAtendimento(e) {
  e.preventDefault()

  if (!formAtendimento.empresa_id || !formAtendimento.descricao) {
    alert('Selecione a empresa e informe a descrição do atendimento.')
    return
  }

  setSalvandoAtendimento(true)

  const dadosAtendimento = {
    empresa_id: Number(formAtendimento.empresa_id),
    tipo: formAtendimento.tipo,
    descricao: formAtendimento.descricao,
    data_atividade: formAtendimento.data_atividade,
    proximo_retorno: formAtendimento.proximo_retorno || null,
    concluido: formAtendimento.concluido
  }
  const consultaAtendimento = atendimentoEditandoId
    ? supabase.from('atividades').update(dadosAtendimento).eq('id', atendimentoEditandoId)
    : supabase.from('atividades').insert([dadosAtendimento])
  const { error } = await consultaAtendimento

  if (error) {
    alert('Erro ao salvar atendimento: ' + error.message)
    setSalvandoAtendimento(false)
    return
  }

  setMensagemAtendimento(atendimentoEditandoId ? 'Atendimento atualizado com sucesso!' : 'Atendimento registrado com sucesso!')
  setAtendimentoEditandoId(null)
  setMostrarFormAtendimento(false)
  setSalvandoAtendimento(false)

  setFormAtendimento({
    empresa_id: '',
    tipo: 'Ligação',
    descricao: '',
    data_atividade: new Date().toISOString().slice(0, 10),
    proximo_retorno: '',
    concluido: false
  })

  await carregarDados()
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Atendimentos</h1>
          <p>Histórico de contatos e atividades comerciais.</p>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={() => { setAtendimentoEditandoId(null); setFormAtendimento({ empresa_id:'', tipo:'Ligação', descricao:'', data_atividade:new Date().toISOString().slice(0,10), proximo_retorno:'', concluido:false }); setMostrarFormAtendimento(true) }}
      >
        + Novo Atendimento
      </button>

      {mensagemAtendimento && (
        <p>{mensagemAtendimento}</p>
      )}

      {mostrarFormAtendimento && (
        <section className="panel">
          <form onSubmit={salvarAtendimento}>

            <label>Empresa</label>
            <select
              value={formAtendimento.empresa_id}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  empresa_id: e.target.value
                })
              }
              required
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>

            <label>Tipo de atendimento</label>
            <select
              value={formAtendimento.tipo}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  tipo: e.target.value
                })
              }
            >
              <option value="Ligação">Ligação</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Visita">Visita</option>
              <option value="E-mail">E-mail</option>
              <option value="Reunião">Reunião</option>
              <option value="Orçamento">Orçamento</option>
              <option value="Observação">Observação</option>
            </select>

            <label>Descrição</label>
            <textarea
              value={formAtendimento.descricao}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  descricao: e.target.value
                })
              }
              placeholder="Descreva o atendimento realizado..."
              required
            />

            <label>Data do atendimento</label>
            <input
              type="date"
              value={formAtendimento.data_atividade}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  data_atividade: e.target.value
                })
              }
            />

            <label>Próximo retorno</label>
            <input
              type="date"
              value={formAtendimento.proximo_retorno}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  proximo_retorno: e.target.value
                })
              }
            />

            <label>
              <input
                type="checkbox"
                checked={formAtendimento.concluido}
                onChange={(e) =>
                  setFormAtendimento({
                    ...formAtendimento,
                    concluido: e.target.checked
                  })
                }
              />
              Atendimento concluído
            </label>

            <div>
              <button
                type="submit"
                className="btn-primary"
                disabled={salvandoAtendimento}
              >
                {salvandoAtendimento ? 'Salvando...' : 'Salvar Atendimento'}
              </button>

              <button
                type="button"
                onClick={() => setMostrarFormAtendimento(false)}
              >
                Cancelar
              </button>
            </div>

          </form>
        </section>
      )}

      <section className="panel">
        {atividades.map((item) => (
          <div className="activity" key={item.id}>
            <div className="activity-icon"></div>

            <div>
              <b>{item.tipo || 'Atendimento'}</b>
              <span>{nomeEmpresa(item.empresa_id)}</span>
              <p>{item.descricao || 'Sem descrição.'}</p>

              {item.proximo_retorno && (
                <p>
                  Próximo retorno: {dataBR(item.proximo_retorno)}
                </p>
              )}
            </div>

            <small>{dataBR(item.data_atividade)}</small>
            <div className="actions">{linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade) && <a className="btn-whatsapp" href={linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade)} target="_blank" rel="noreferrer">WhatsApp</a>}<button type="button" className="btn-editar" onClick={() => editarAtendimento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirAtendimento(item.id)}>Excluir</button></div>
          </div>
        ))}

        {!atividades.length && (
          <div className="empty">
            Nenhum atendimento registrado. Os botões Editar e Excluir aparecerão em cada atendimento cadastrado.
          </div>
        )}
      </section>
    </>
  )
}
  function Agenda() {
    const [mostrarFormTarefa, setMostrarFormTarefa] = useState(() => !!sessionStorage.getItem('centraltruck_agendar_empresa') || !!localStorage.getItem('ct_rascunho_agenda'))
    const [salvandoTarefa, setSalvandoTarefa] = useState(false)
    const [mensagemTarefa, setMensagemTarefa] = useState('')
    const [lembrarNoCRM, setLembrarNoCRM] = useState(true)
    const [antecedencia, setAntecedencia] = useState('0')
    const [avisosAgenda, setAvisosAgenda] = useState([])
    const numeroLembrete = '31975255079'
    useEffect(() => {
      const verificar = () => {
        const agora = Date.now()
        const avisos = tarefas.filter(t => {
          if (t.status === 'Concluída' || !t.data_hora || localStorage.getItem('ct_lembrete_' + t.id) === 'nao') return false
          const prazo = new Date(t.data_hora).getTime() - Number(localStorage.getItem('ct_antecedencia_' + t.id) || 0) * 60000
          return prazo <= agora && agora - prazo < 86400000
        })
        setAvisosAgenda(avisos)
        avisos.forEach(t => {
          const chave = 'ct_aviso_exibido_' + t.id + '_' + t.data_hora
          if (!sessionStorage.getItem(chave) && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Central Truck — Lembrete', {body: t.titulo + ' • ' + (nomeEmpresa(t.empresa_id) || 'Contato')})
            sessionStorage.setItem(chave, 'sim')
          }
        })
      }
      verificar()
      const intervalo = setInterval(verificar, 60000)
      return () => clearInterval(intervalo)
    }, [tarefas])
    const whatsappParaMim = tarefa => {
      const telefone = numeroLembrete.replace(/\D/g, '')
      const destino = telefone.startsWith('55') ? telefone : '55' + telefone
      const mensagem = 'LEMBRETE CENTRAL TRUCK%0A' + encodeURIComponent('Cliente: ' + nomeEmpresa(tarefa.empresa_id) + '\nTarefa: ' + tarefa.titulo + '\nData: ' + dataBR(tarefa.data_hora) + '\n' + (tarefa.descricao || ''))
      return 'https://wa.me/' + destino + '?text=' + mensagem
    }

    const [tarefaEditandoId, setTarefaEditandoId] = useState(null)
    const [formTarefa, setFormTarefa] = useState(() => {
       try { const salvo = JSON.parse(localStorage.getItem('ct_rascunho_agenda') || 'null'); if (salvo && typeof salvo === 'object') return salvo } catch (_) {}
       return { empresa_id: '', cliente_avulso: '', titulo: '', descricao: '', data_hora: '', prioridade: 'Normal', status: 'Pendente' }
     })
     useEffect(() => {
       if (mostrarFormTarefa) localStorage.setItem('ct_rascunho_agenda', JSON.stringify(formTarefa))
     }, [formTarefa, mostrarFormTarefa])

    useEffect(() => {
      const id = sessionStorage.getItem('centraltruck_agendar_empresa')
      if (id) {
        setFormTarefa(anterior => ({ ...anterior, empresa_id: id, titulo: 'Retornar contato', status: 'Pendente' }))
        setMostrarFormTarefa(true)
        sessionStorage.removeItem('centraltruck_agendar_empresa')
      }
    }, [])

    function editarTarefa(item) {
      setFormTarefa({
        empresa_id: item.empresa_id || '',
        cliente_avulso: (item.descricao || '').match(/^Cliente não cadastrado: (.*?)(?:\n|$)/)?.[1] || '',
        titulo: item.titulo || '',
        descricao: (item.descricao || '').replace(/^Cliente não cadastrado: .*?(?:\n|$)/, ''),
        data_hora: item.data_hora ? String(item.data_hora).slice(0,16) : '',
        prioridade: item.prioridade || 'Normal',
        status: item.status || 'Pendente'
      })
      setTarefaEditandoId(item.id)
      setLembrarNoCRM(localStorage.getItem('ct_lembrete_' + item.id) !== 'nao')
      setAntecedencia(localStorage.getItem('ct_antecedencia_' + item.id) || '0')
      setMostrarFormTarefa(true)
    }

    async function excluirTarefa(id) {
      const confirmar = window.confirm('Tem certeza que deseja excluir esta tarefa?')
      if (!confirmar) return

      const { error } = await supabase.from('tarefas').delete().eq('id', id)
      if (error) {
        alert('Erro ao excluir tarefa: ' + error.message)
        return
      }
      await carregarDados()
    }

    async function salvarTarefa(e) {
      e.preventDefault()

      if (!formTarefa.titulo.trim() || !formTarefa.data_hora) {
        alert('Informe o título e a data/hora da tarefa.')
        return
      }

      setSalvandoTarefa(true)
      setMensagemTarefa('')

      const dadosTarefa = {
        empresa_id: formTarefa.empresa_id ? Number(formTarefa.empresa_id) : null,
        titulo: formTarefa.titulo.trim(),
        descricao: [!formTarefa.empresa_id && formTarefa.cliente_avulso.trim() ? 'Cliente não cadastrado: ' + formTarefa.cliente_avulso.trim() : '', formTarefa.descricao.trim()].filter(Boolean).join('\n') || null,
        data_hora: formTarefa.data_hora,
        prioridade: formTarefa.prioridade,
        status: formTarefa.status,
      }
      const consultaTarefa = tarefaEditandoId
        ? supabase.from('tarefas').update(dadosTarefa).eq('id', tarefaEditandoId)
        : supabase.from('tarefas').insert([dadosTarefa])
      const { error } = await consultaTarefa

      if (error) {
        alert('Erro ao salvar tarefa: ' + error.message)
        setSalvandoTarefa(false)
        return
      }

      const idSalvo = tarefaEditandoId
      if (idSalvo) { localStorage.setItem('ct_lembrete_' + idSalvo, lembrarNoCRM ? 'sim' : 'nao'); localStorage.setItem('ct_antecedencia_' + idSalvo, antecedencia) }
      localStorage.removeItem('ct_rascunho_agenda')
       setMensagemTarefa(tarefaEditandoId ? 'Tarefa atualizada com sucesso!' : 'Tarefa cadastrada com sucesso!')
      setTarefaEditandoId(null)
      setMostrarFormTarefa(false)
      setSalvandoTarefa(false)
      setFormTarefa({
        empresa_id: '',
        titulo: '',
        descricao: '',
        data_hora: '',
        prioridade: 'Normal',
        status: 'Pendente',
      })
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Agenda</h1>
            <p>Retornos, ligações, visitas e tarefas comerciais. {tarefas.length} tarefa(s) sincronizada(s) com o Dashboard.</p>
          </div>
        </div>

        <button type="button" className="btn-secondary" onClick={carregarDados} style={{marginRight:12}}>↻ Atualizar agendamentos</button>
        {erro && <p role="alert">Erro ao carregar agenda: {erro}</p>}
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setTarefaEditandoId(null); setFormTarefa({ empresa_id:'', cliente_avulso:'', titulo:'', descricao:'', data_hora:'', prioridade:'Normal', status:'Pendente' }); setMostrarFormTarefa(true) }}
        >
          + Nova Tarefa
        </button>

        {mostrarFormTarefa && (
          <section className="panel form-panel">
            <form onSubmit={salvarTarefa}>
              <div className="form-grid">
                <label>
                  Empresa
                  <select
                    value={formTarefa.empresa_id}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, empresa_id: e.target.value })
                    }
                  >
                    <option value="">Sem empresa vinculada</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome_fantasia || empresa.nome}
                      </option>
                    ))}
                  </select>
                </label>

                {!formTarefa.empresa_id && (
                  <label>
                    Nome do cliente não cadastrado
                    <input
                      type="text"
                      value={formTarefa.cliente_avulso || ''}
                      onChange={(e) => setFormTarefa({ ...formTarefa, cliente_avulso: e.target.value })}
                      placeholder="Digite o nome do cliente ou empresa"
                    />
                  </label>
                )}

                <label>
                  Título
                  <input
                    type="text"
                    value={formTarefa.titulo}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, titulo: e.target.value })
                    }
                    placeholder="Ex.: Retornar para cliente"
                    required
                  />
                </label>

                <label>
                  Data e hora
                  <input
                    type="datetime-local"
                    value={formTarefa.data_hora}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, data_hora: e.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Prioridade
                  <select
                    value={formTarefa.prioridade}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, prioridade: e.target.value })
                    }
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={formTarefa.status}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, status: e.target.value })
                    }
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </label>

                <label className="full">
                  Descrição
                  <textarea
                    value={formTarefa.descricao}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, descricao: e.target.value })
                    }
                    placeholder="Observações sobre a tarefa..."
                  />
                </label>
              </div>

              <div style={{margin:'12px 0',display:'flex',gap:'14px',flexWrap:'wrap',alignItems:'center'}}><label><input type="checkbox" checked={lembrarNoCRM} onChange={e=>setLembrarNoCRM(e.target.checked)} /> Lembrar no CRM</label><label>Antecedência <select value={antecedencia} onChange={e=>setAntecedencia(e.target.value)}><option value="0">Na hora</option><option value="15">15 minutos</option><option value="60">1 hora</option><option value="1440">1 dia</option></select></label><button type="button" onClick={() => { if ('Notification' in window) Notification.requestPermission(); else alert('Seu navegador não suporta notificações.'); }}>Ativar notificações do navegador</button></div><p style={{fontSize:'12px'}}>Avisos automáticos funcionam enquanto o CRM estiver aberto. O envio pelo WhatsApp exige clicar em enviar.</p>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={salvandoTarefa}>
                  {salvandoTarefa ? 'Salvando...' : 'Salvar Tarefa'}
                </button>
                <button type="button" onClick={() => setMostrarFormTarefa(false)}>
                  Cancelar
                </button>
              </div>

              {mensagemTarefa && <p>{mensagemTarefa}</p>}
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-heading"><div><h2>Agendamentos cadastrados ({tarefas.length})</h2><p>Todos os contatos salvos na Agenda.</p></div></div>
          {tarefas.map((tarefa) => (
            <div className="activity" key={tarefa.id}>
              <div className="activity-icon">✓</div>
              <div>
                <b>{tarefa.titulo}</b>
                <span>{nomeEmpresa(tarefa.empresa_id)}</span>
                <p>{tarefa.descricao || 'Sem descrição.'}</p>
              </div>
              <div className="task-date">
                <b>{dataBR(tarefa.data_hora)}</b>
                <span>{tarefa.status}</span>
                <div className="actions">
                  <a className="btn-whatsapp" href={whatsappParaMim(tarefa)} target="_blank" rel="noreferrer">🔔 Lembrete no meu WhatsApp</a>
                  <button type="button" className="btn-editar" onClick={() => editarTarefa(tarefa)}>Editar</button>
                  <button type="button" className="btn-excluir" onClick={() => excluirTarefa(tarefa.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
          {!tarefas.length && (
            <div className="empty">Nenhuma tarefa cadastrada.</div>
          )}
        </section>
      </>
    )
  }

  function Orcamentos() {
    const chaveRascunho = 'centraltruck_orcamento_rascunho_' + (session?.user?.id || 'local')
    const [mostrarForm, setMostrarForm] = useState(() => {
      try { return Boolean(JSON.parse(localStorage.getItem(chaveRascunho))?.aberto) } catch { return false }
    })
    const [salvando, setSalvando] = useState(false)
    const [filtroMes, setFiltroMes] = useState('')
    const [filtroInicio, setFiltroInicio] = useState('')
    const [filtroFim, setFiltroFim] = useState('')
    const orcamentosFiltrados = orcamentos.filter(item => {
      if (!item.data_envio) return !filtroMes && !filtroInicio && !filtroFim
      const data = String(item.data_envio).slice(0,10)
      if (filtroMes && data.slice(0,7) !== filtroMes) return false
      if (filtroInicio && data < filtroInicio) return false
      if (filtroFim && data > filtroFim) return false
      return true
    })
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(() => {
      try { return JSON.parse(localStorage.getItem(chaveRascunho))?.editandoId ?? null } catch { return null }
    })
    const [osAberta, setOsAberta] = useState(null)
    const [osArquivos, setOsArquivos] = useState([])
    const [osErro, setOsErro] = useState('')
    const [osEnviando, setOsEnviando] = useState(false)
    async function carregarOS(item) {
      setOsAberta(item)
      setOsErro('')
      const {data,error} = await supabase.storage.from('orcamento-anexos').list(String(item.id))
      if(error){setOsErro('Armazenamento indisponível: '+error.message);setOsArquivos([]);return}
      setOsArquivos((data||[]).filter(x=>x.name!=='.emptyFolderPlaceholder'))
    }
    async function anexarOS(e) {
      const arquivo=e.target.files?.[0]
      e.target.value=''
      if(!arquivo||!osAberta)return
      if(arquivo.size>10485760){setOsErro('Limite de 10 MB por arquivo.');return}
      if(!/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(arquivo.name)){setOsErro('Selecione PDF, Word ou imagem.');return}
      setOsEnviando(true)
      setOsErro('')
      try {
        const nome=Date.now()+'-'+arquivo.name.replace(/[^a-zA-Z0-9._-]/g,'_')
        const {error}=await supabase.storage.from('orcamento-anexos').upload(String(osAberta.id)+'/'+nome,arquivo)
        if(error)throw error
        await carregarOS(osAberta)
      }catch(error){setOsErro('Erro ao salvar OS: '+error.message)}
      finally{setOsEnviando(false)}
    }
    async function visualizarOS(nome) {
      const {data,error}=await supabase.storage.from('orcamento-anexos').createSignedUrl(String(osAberta.id)+'/'+nome,120)
      if(error){setOsErro(error.message);return}
      window.open(data.signedUrl,'_blank','noopener,noreferrer')
    }
    const [form, setForm] = useState(() => {
      let anterior = null
      try { anterior = JSON.parse(localStorage.getItem(chaveRascunho))?.form } catch {}
      return anterior || {
      empresa_id: '',
      oportunidade_id: '',
      numero_orcamento: '',
      descricao: '',
      valor: '',
      status: 'Enviado',
      data_envio: new Date().toISOString().slice(0, 10),
      validade: '',
      observacoes: '',
      }
    })
    useEffect(() => {
      if (mostrarForm) localStorage.setItem(chaveRascunho, JSON.stringify({aberto:true,editandoId:orcamentoEditandoId,form}))
    }, [mostrarForm, orcamentoEditandoId, form, chaveRascunho])

    async function salvarOrcamento(e) {
      e.preventDefault()
      if (!form.empresa_id || !form.descricao) {
        alert('Selecione a empresa e informe a descrição.')
        return
      }
      setSalvando(true)
      const dadosOrcamento = {
        empresa_id: Number(form.empresa_id),
        oportunidade_id: form.oportunidade_id ? Number(form.oportunidade_id) : null,
        numero_orcamento: form.numero_orcamento.trim() || null,
        descricao: form.descricao.trim(),
        valor: form.valor ? Number(form.valor) : null,
        status: form.status,
        data_envio: form.data_envio || null,
        validade: form.validade || null,
        observacoes: form.observacoes.trim() || null,
      }
      const consultaOrcamento = orcamentoEditandoId
        ? supabase.from('orcamentos').update(dadosOrcamento).eq('id', orcamentoEditandoId)
        : supabase.from('orcamentos').insert([dadosOrcamento])
      const { error } = await consultaOrcamento
      if (error) {
        alert('Erro ao salvar orçamento: ' + error.message)
        setSalvando(false)
        return
      }
      setForm({
        empresa_id: '', oportunidade_id: '', numero_orcamento: '', descricao: '',
        valor: '', status: 'Enviado', data_envio: new Date().toISOString().slice(0, 10),
        validade: '', observacoes: '',
      })
      localStorage.removeItem(chaveRascunho)
      setOrcamentoEditandoId(null)
      setMostrarForm(false)
      setSalvando(false)
      await carregarDados()
    }

    function editarOrcamento(item) {
      setForm({
        empresa_id: item.empresa_id || '',
        oportunidade_id: item.oportunidade_id || '',
        numero_orcamento: item.numero_orcamento || '',
        descricao: item.descricao || '',
        valor: item.valor ?? '',
        status: item.status || 'Enviado',
        data_envio: item.data_envio ? String(item.data_envio).slice(0,10) : '',
        validade: item.validade ? String(item.validade).slice(0,10) : '',
        observacoes: item.observacoes || ''
      })
      setOrcamentoEditandoId(item.id)
      setMostrarForm(true)
    }

    async function excluirOrcamento(id) {
      if (!window.confirm('Excluir este orçamento?')) return
      const { error } = await supabase.from('orcamentos').delete().eq('id', id)
      if (error) return alert('Erro ao excluir orçamento: ' + error.message)
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Orçamentos</h1>
            <p>Controle dos orçamentos enviados aos clientes.</p>
          </div>
          <button className="primary" onClick={() => {
            if (mostrarForm) { localStorage.removeItem(chaveRascunho); setMostrarForm(false); setOrcamentoEditandoId(null); return }
            setOrcamentoEditandoId(null)
            setForm({ empresa_id:'', oportunidade_id:'', numero_orcamento:'', descricao:'', valor:'', status:'Enviado', data_envio:new Date().toISOString().slice(0,10), validade:'', observacoes:'' })
            setMostrarForm(true)
          }}>
            {mostrarForm ? 'Cancelar' : '+ Novo Orçamento'}
          </button>
        </div>

        {mostrarForm && (
          <section className="panel">
            <h2>{orcamentoEditandoId ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
            <form onSubmit={salvarOrcamento}>
              <div className="form-grid">
                <label>Empresa *
                  <select value={form.empresa_id} onChange={(e) => setForm({...form, empresa_id:e.target.value})} required>
                    <option value="">Selecione</option>
                    {empresas.map((x)=><option key={x.id} value={x.id}>{x.nome_fantasia || x.nome}</option>)}
                  </select>
                </label>
                <label>Oportunidade
                  <select value={form.oportunidade_id} onChange={(e) => setForm({...form, oportunidade_id:e.target.value})}>
                    <option value="">Sem vínculo</option>
                    {oportunidades.filter((x)=>!form.empresa_id || String(x.empresa_id)===String(form.empresa_id)).map((x)=><option key={x.id} value={x.id}>{x.titulo}</option>)}
                  </select>
                </label>
                <label>Número
                  <input value={form.numero_orcamento} onChange={(e)=>setForm({...form,numero_orcamento:e.target.value})} placeholder="Ex.: ORC-001"/>
                </label>
                <label>Valor (R$)
                  <input type="number" min="0" step="0.01" value={form.valor} onChange={(e)=>setForm({...form,valor:e.target.value})}/>
                </label>
                <label>Status
                  <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                    {['Rascunho','Enviado','Visualizado','Em negociação','Aprovado','Recusado','Finalizado'].map((x)=><option key={x}>{x}</option>)}
                  </select>
                </label>
                <label>Data de envio
                  <input type="date" value={form.data_envio} onChange={(e)=>setForm({...form,data_envio:e.target.value})}/>
                </label>
                <label>Validade
                  <input type="date" value={form.validade} onChange={(e)=>setForm({...form,validade:e.target.value})}/>
                </label>
                <label className="full">Descrição *
                  <textarea value={form.descricao} onChange={(e)=>setForm({...form,descricao:e.target.value})} required/>
                </label>
                <label className="full">Observações
                  <textarea value={form.observacoes} onChange={(e)=>setForm({...form,observacoes:e.target.value})}/>
                </label>
              </div>
              <div className="form-actions">
                <button className="primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar Orçamento'}</button>
              </div>
            </form>
          </section>
        )}

        {osAberta && <section className="panel">
          <h2>Anexar OS — Orçamento {osAberta.numero_orcamento || osAberta.id}</h2>
          <p>Selecione PDF, Word ou imagem (máximo 10 MB).</p>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={osEnviando} onChange={anexarOS}/>
          {osEnviando && <p>Enviando...</p>}
          {osErro && <p role="alert" style={{color:'#ff8585'}}>{osErro}</p>}
          {osArquivos.map(a=><div key={a.name} style={{marginTop:10}}>
            <span>{a.name} </span>
            <button type="button" onClick={()=>visualizarOS(a.name)}>Abrir / baixar</button>
          </div>)}
          <button type="button" onClick={()=>setOsAberta(null)}>Fechar</button>
        </section>}
        <section className="panel" style={{marginBottom:16}}>
          <h2>Filtrar orçamentos por mês e data</h2>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}>
            <label>Mês <input type="month" value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/></label>
            <label>Data inicial <input type="date" value={filtroInicio} onChange={e=>setFiltroInicio(e.target.value)}/></label>
            <label>Data final <input type="date" value={filtroFim} onChange={e=>setFiltroFim(e.target.value)}/></label>
            <button type="button" onClick={()=>{setFiltroMes('');setFiltroInicio('');setFiltroFim('')}}>Limpar filtros</button>
          </div>
          <p>{orcamentosFiltrados.length} orçamento(s) encontrado(s)</p>
        </section>
        <section className="panel table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Empresa</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Envio</th><th>Ações</th></tr></thead>
            <tbody>
              {orcamentosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.numero_orcamento || `#${item.id}`}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.descricao || '—'}</td>
                  <td>{dinheiro(item.valor)}</td>
                  <td><span className="status">{item.status}</span></td>
                  <td>{dataBR(item.data_envio)}</td>
                  <td><div className="actions"><button type="button" onClick={() => carregarOS(item)}>Anexar OS</button><button type="button" className="btn-editar" onClick={() => editarOrcamento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={()=>excluirOrcamento(item.id)}>Excluir</button></div></td>
                </tr>
              ))}
              {!orcamentos.length && <tr><td colSpan="7" className="empty">Nenhum orçamento cadastrado.</td></tr>}
            </tbody>
          </table>
        </section>
      </>
    )
  }

  function Relatorios() {
    const [arquivoLeads, setArquivoLeads] = useState(null)
    const [importandoLeads, setImportandoLeads] = useState(false)
    const [msgImportacao, setMsgImportacao] = useState('')

    async function baixarModeloLeads() {
      const XLSX = await import('xlsx')
      const dados = [
        ['CENTRAL TRUCK SERVICE'],
        ['LISTA DE LEADS - IMPORTACAO PARA O CRM'],
        [],
        ['Nome da empresa','Nome fantasia','CNPJ','Segmento','Classificacao','Status','Cidade','Estado','Telefone','WhatsApp','E-mail','Site','Observacoes'],
        ['Transportadora Exemplo','Exemplo Logistica','','Transportadora','A','Lead novo','Contagem','MG','31999999999','31999999999','contato@exemplo.com.br','','Cliente para prospeccao']
      ]
      const ws = XLSX.utils.aoa_to_sheet(dados)
      ws['!merges'] = [XLSX.utils.decode_range('A1:M1'), XLSX.utils.decode_range('A2:M2')]
      ws['!cols'] = [{wch:28},{wch:26},{wch:20},{wch:20},{wch:15},{wch:20},{wch:20},{wch:10},{wch:18},{wch:18},{wch:30},{wch:28},{wch:38}]
      ws['!rows'] = [{hpt:34},{hpt:25},{hpt:8},{hpt:28}]
      ws['!autofilter'] = { ref: 'A4:M5' }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Leads Central Truck')
      XLSX.writeFile(wb, 'Modelo_Leads_Central_Truck.xlsx')
    }

    function separarCSV(linha) {
      const valores = []
      let atual = ''
      let aspas = false
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i]
        if (ch === '"') {
          if (aspas && linha[i + 1] === '"') { atual += '"'; i++ } else aspas = !aspas
        } else if ((ch === ',' || ch === ';') && !aspas) {
          valores.push(atual.trim()); atual = ''
        } else atual += ch
      }
      valores.push(atual.trim())
      return valores
    }

    async function importarLeads() {
      if (!arquivoLeads) { setMsgImportacao('Selecione um arquivo para continuar.'); return }
      const extensao = (arquivoLeads.name.split('.').pop() || '').toLowerCase()
      if (extensao !== 'csv') {
        setMsgImportacao('Arquivo recebido sem alterar o original. PDF, JPG/PNG e Word podem ser enviados e mantidos no formato original; para cadastrar clientes automaticamente no Funil, use CSV.')
        return
      }
      setImportandoLeads(true)
      setMsgImportacao('')
      try {
        const texto = await arquivoLeads.text()
        const linhas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim())
        if (linhas.length < 2) throw new Error('O arquivo está vazio ou sem clientes.')
        const colunas = separarCSV(linhas[0]).map((x) => x.toLowerCase().trim())
        const obrigatoria = colunas.indexOf('nome')
        if (obrigatoria < 0) throw new Error('A coluna "nome" é obrigatória. Use o modelo disponível.')
        let importados = 0
        let falhas = 0
        for (const linha of linhas.slice(1)) {
          const valores = separarCSV(linha)
          const registro = {}
          colunas.forEach((col, idx) => { registro[col] = (valores[idx] || '').trim() })
          if (!registro.nome) { falhas++; continue }
          const status = registro.status || 'Lead novo'
          const empresa = {
            nome: registro.nome,
            nome_fantasia: registro.nome_fantasia || null,
            cnpj: registro.cnpj || null,
            segmento: registro.segmento || null,
            classificacao: ['A','B','C'].includes((registro.classificacao || '').toUpperCase()) ? registro.classificacao.toUpperCase() : 'B',
            status,
            cidade: registro.cidade || null,
            estado: registro.estado || 'MG',
            telefone: registro.telefone || null,
            whatsapp: registro.whatsapp || null,
            email: registro.email || null,
            site: registro.site || null,
            observacoes: registro.observacoes || null
          }
          const { data: criada, error: erroEmpresa } = await supabase.from('empresas').insert([empresa]).select('id').single()
          if (erroEmpresa || !criada?.id) { falhas++; continue }
          importados++
        }
        await carregarDados()
        setArquivoLeads(null)
        setMsgImportacao(importados + ' cliente(s) importado(s) para Empresas/Leads. Oportunidades só serão criadas quando cadastradas explicitamente.' + (falhas ? ' ' + falhas + ' linha(s) com erro.' : ''))
      } catch (e) {
        setMsgImportacao('Erro na importação: ' + e.message)
      } finally {
        setImportandoLeads(false)
      }
    }

    return (
      <>
        <div className="page-title"><div><h1>Relatórios</h1><p>Indicadores comerciais da Central Truck.</p></div></div>
        <section className="cards">
          <Card titulo="Leads" valor={empresas.length} />
          <Card titulo="Contatos" valor={contatos.length} />
          <Card titulo="Oportunidades" valor={oportunidades.length} />
          <Card titulo="Vendas" valor={vendas.length} />
          <Card titulo="Conversão" valor={`${conversao}%`} />
          <Card titulo="Valor Vendido" valor={dinheiro(valorVendido)} />
        </section>
        <section className="panel lead-import-panel">
          <div className="panel-heading">
            <div><h2>Enviar relatórios e importar clientes</h2><p>Selecione PDF, JPG, PNG, Word ou CSV. O arquivo original é mantido sem alteração; listas em CSV podem ser organizadas automaticamente em Empresas/Leads e no Funil Comercial.</p></div>
          </div>
          <div className="lead-import-actions">
            <button type="button" className="btn-secondary" onClick={baixarModeloLeads}>Baixar modelo Excel</button>
            <label className="file-import-box">
              <span>{arquivoLeads ? arquivoLeads.name : 'Selecionar lista de clientes (.CSV)'}</span>
              <input type="file" accept=".csv,text/csv" onChange={(e)=>{setArquivoLeads(e.target.files?.[0] || null);setMsgImportacao('')}} />
            </label>
            <button type="button" className="primary" disabled={importandoLeads || !arquivoLeads} onClick={importarLeads}>{importandoLeads ? 'Importando...' : 'Importar clientes para o Funil'}</button>
          </div>
          <p className="import-help"><b>Importação de clientes:</b> use CSV para cadastrar automaticamente Empresas/Leads e criar as oportunidades no Funil. Colunas aceitas: nome, nome_fantasia, CNPJ, segmento, classificação A/B/C, status, cidade, estado, telefone, WhatsApp, e-mail, site e observações.</p>
          <div className="import-message"><b>Relatórios PDF, JPG, PNG e Word:</b> são documentos para consulta e não são convertidos automaticamente em clientes, evitando perda de formatação ou cadastro incorreto. Para importar uma lista desses formatos, converta-a primeiro para CSV usando o modelo acima.</div>
          {msgImportacao && <div className="import-message">{msgImportacao}</div>}
        </section>
      </>
    )
  }


  function ImportarContatos() {
    const [arquivo, setArquivo] = useState(null)
    const [importando, setImportando] = useState(false)
    const [mensagem, setMensagem] = useState('')

    const normalizar = (v='') => String(v ?? '').trim()
    const chave = (v='') => normalizar(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')

    function valorCampo(registro, nomes) {
      for (const nome of nomes) {
        const k = Object.keys(registro).find(x => chave(x) === chave(nome))
        if (k && normalizar(registro[k])) return normalizar(registro[k])
      }
      return ''
    }

    async function lerArquivo(file) {
      const ext=(file.name.split('.').pop()||'').toLowerCase()
      if (['xlsx','xls','xlsm','xlsb','ods','csv','txt'].includes(ext)) {
        const XLSX=await import('xlsx')
        const buffer=await file.arrayBuffer()
        const wb=XLSX.read(buffer,{type:'array'})
        const aliases=['empresa','nome da empresa','razao social','nome fantasia','nome','cliente','oficina','estabelecimento','organizacao','company','organization','contato','nome do contato','telefone','celular','whatsapp','email','e-mail','endereco','cidade','cnpj','responsavel']
        const saida=[]
        for(const nomeAba of wb.SheetNames){
          const matriz=XLSX.utils.sheet_to_json(wb.Sheets[nomeAba],{header:1,defval:'',raw:false,blankrows:false})
          if(!matriz.length) continue
          const pontuacao=linha=>(Array.isArray(linha)?linha:[]).filter(c=>aliases.some(a=>chave(c)===chave(a)||chave(c).startsWith(chave(a))&&chave(a).length>4)).length
          const candidatos=matriz.slice(0,30).map((linha,i)=>({i,p:pontuacao(linha)})).sort((a,b)=>b.p-a.p)
          const indice=candidatos[0]?.p>=2?candidatos[0].i:-1
          if(indice<0) continue
          const titulos=matriz[indice].map((c,i)=>normalizar(c)||'Coluna '+(i+1))
          const registros=matriz.slice(indice+1).filter(linha=>Array.isArray(linha)&&linha.some(c=>normalizar(c))).map(linha=>Object.fromEntries(titulos.map((titulo,i)=>[titulo,linha[i]??''])))
          saida.push(...registros)
        }
        if(!saida.length) throw new Error('Não identifiquei automaticamente os campos desta planilha. Envie uma planilha com títulos como Nome, Empresa, Telefone ou E-mail.')
        return saida
      }
      if (['json'].includes(ext)) {
        const obj=JSON.parse(await file.text())
        return Array.isArray(obj)?obj:(obj.contatos||obj.clientes||obj.empresas||[])
      }
      if (['vcf','vcard'].includes(ext)) {
        const texto=await file.text()
        return texto.split(/BEGIN:VCARD/i).slice(1).map(bloco=>{
          const pega=(re)=>((bloco.match(re)||[])[1]||'').trim()
          return {nome:pega(/\nFN[^:]*:([^\r\n]+)/i),telefone:pega(/\nTEL[^:]*:([^\r\n]+)/i),email:pega(/\nEMAIL[^:]*:([^\r\n]+)/i),empresa:pega(/\nORG[^:]*:([^\r\n]+)/i)}
        })
      }
      throw new Error('Formato não compatível para importação automática.')
    }

    async function importar() {
      if(!arquivo){setMensagem('Selecione um arquivo.');return}
      setImportando(true); setMensagem('')
      try{
        const linhas=await lerArquivo(arquivo)
        if(!linhas.length) throw new Error('Nenhum contato encontrado no arquivo.')
        let ok=0, erros=0
        for(const r of linhas){
          const nomeEmpresa=valorCampo(r,['nome da empresa','empresa','razao social','razão social','nome fantasia','cliente','oficina','estabelecimento','organização','nome','company','organization','org','nome do contato','contato'])
          const contato=valorCampo(r,['pessoa de contato','contato','responsavel','responsável','nome do contato','nome decisor / contato','contact','contact name'])
          const camposTelefone = Object.keys(r).filter(k => /^(telefone|fone|tel|celular|whatsapp|whats|zap|phone|mobile|contatotelefonico|numero)/.test(chave(k)))
          const telefone=valorCampo(r,['telefone','telefone comercial','fone','phone','celular','mobile','telefone 1','telefone principal','telefone 2','telefone de contato','contato telefonico','fone/whatsapp','telefone/whatsapp','tel','numero de telefone']) || camposTelefone.map(k => normalizar(r[k])).find(Boolean) || ''
          const whatsapp=valorCampo(r,['whatsapp','telefone direto / whatsapp','telefone direto whatsapp','whats app','zap','celular whatsapp','telefone whatsapp']) || telefone
          const email=valorCampo(r,['email','e-mail','e-mail corporativo / público','email corporativo publico','mail','correio eletronico'])
          const cidade=valorCampo(r,['cidade','city'])
          const estado=valorCampo(r,['estado','uf','state']) || 'MG'
          const segmento=valorCampo(r,['segmento','categoria','ramo'])
          const status=valorCampo(r,['status','etapa']) || 'Lead novo'
          const cnpj=valorCampo(r,['cnpj','cpf/cnpj','documento'])
          const observacoes=[valorCampo(r,['observacoes','observações','obs','notes']),...['Cargo / área decisora','Frota / operação','Tecnologias / equipamentos','Prioridade','LinkedIn decisor','Funcionários estimados'].map(c=>valorCampo(r,[c])?c+': '+valorCampo(r,[c]):'')].filter(Boolean).join(' | ')
          if(!nomeEmpresa){erros++;continue}
          const dados={nome:nomeEmpresa,nome_fantasia:null,cnpj:cnpj||null,segmento:segmento||null,status,cidade:cidade||null,estado,telefone:telefone||null,whatsapp:whatsapp||null,email:email||null,observacoes:[contato?'Contato: '+contato:'',observacoes].filter(Boolean).join(' | ')||null}
          const {error}=await supabase.from('empresas').insert([dados])
          if(error) { erros++; console.error('Falha ao importar empresa:',nomeEmpresa,error); }
          else ok++
        }
        await carregarDados()
        if(ok>0) {
          setPagina('empresas')
          window.alert(ok+' empresa(s) salva(s) em Empresas / Leads.'+(erros?' '+erros+' registro(s) falharam; confira o console para detalhes.':''))
        } else {
          setMensagem('Nenhuma empresa foi salva. '+erros+' registro(s) falharam. Confira os nomes das empresas e as permissões de gravação no Supabase.')
        }
      }catch(e){setMensagem('Erro: '+e.message)}
      finally{setImportando(false)}
    }

    return <>
      <div className="page-title"><div><h1>Importar Contatos</h1><p>Importe listas de contatos e clientes diretamente para o CRM.</p></div></div>
      <section className="panel lead-import-panel">
        <h2>Selecionar arquivo</h2>
        <p>Compatível com planilhas Excel antigas e atuais, CSV, ODS, TXT, JSON e contatos VCF/vCard.</p>
        <div className="lead-import-actions">
          <label className="file-import-box">
            <span>{arquivo?arquivo.name:'Selecionar arquivo de contatos'}</span>
            <input type="file" accept=".xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.txt,.json,.vcf,.vcard" onChange={e=>{setArquivo(e.target.files?.[0]||null);setMensagem('')}} />
          </label>
          <button type="button" className="primary" disabled={!arquivo||importando} onClick={importar}>{importando?'Importando...':'Importar para o CRM'}</button>
        </div>
        <p className="import-help"><b>Campos reconhecidos automaticamente:</b> empresa, pessoa de contato, CNPJ, segmento, status, cidade, estado, telefone, WhatsApp, e-mail e observações. Os títulos podem variar, por exemplo: Empresa, Razão Social, Contato, Responsável, Fone, Celular, UF ou E-mail.</p>
        <div className="import-message"><b>PDF, JPG/PNG e Word:</b> podem ser mantidos em Relatórios, mas não são convertidos automaticamente em contatos para evitar cadastros incorretos.</div>
        {mensagem&&<div className="import-message">{mensagem}</div>}
      </section>
    </>
  }

  function Configuracoes() {
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Configurações</h1>
            <p>Informações gerais do CRM.</p>
          </div>
        </div>

        <section className="panel config">
          <h2>Central Truck Service</h2>
          <p><b>Sistema:</b> Central Truck CRM</p>
          <p><b>Banco de dados:</b> Supabase</p>
          <p><b>Hospedagem:</b> GitHub Pages</p>
          <p><b>Moeda:</b> Real brasileiro (BRL)</p>
          <p><b>Idioma:</b> Português do Brasil</p>

          <button className="primary" onClick={carregarDados}>
            Testar conexão com banco
          </button>
        </section>
      </>
    )
  }


  function OrdensServico() {
    const vazio = {numero_os:'',empresa_id:'',servicos:'',pecas:'',produto:'',valor_produto:'',valor:'',forma_pagamento:''}
    const [registros,setRegistros] = useState([])
    const [itensCatalogo,setItensCatalogo] = useState([])
    const [itemSelecionado,setItemSelecionado] = useState('')
    const [quantidadeSelecionada,setQuantidadeSelecionada] = useState('1')
    const [busca,setBusca] = useState(() => localStorage.getItem('centraltruck_os_busca') || '')
    const [filtroMesOS,setFiltroMesOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_mes') || '')
    const [filtroNumeroOS,setFiltroNumeroOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_numero') || '')
    const [form,setForm] = useState(() => { try { return {...vazio,...JSON.parse(localStorage.getItem('centraltruck_os_rascunho') || '{}')} } catch { return vazio } })
    const [editando,setEditando] = useState(() => localStorage.getItem('centraltruck_os_editando') || null)
    const [mensagem,setMensagem] = useState('')
    const [salvando,setSalvando] = useState(false)
    const [mostrarBusca,setMostrarBusca] = useState(false)
    const [carregandoOS,setCarregandoOS] = useState(false)
    useEffect(() => { localStorage.setItem('centraltruck_os_rascunho',JSON.stringify(form)) },[form])
    useEffect(() => { localStorage.setItem('centraltruck_os_busca',busca) },[busca])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_mes',filtroMesOS) },[filtroMesOS])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_numero',filtroNumeroOS) },[filtroNumeroOS])
    useEffect(() => { if(editando) localStorage.setItem('centraltruck_os_editando',editando); else localStorage.removeItem('centraltruck_os_editando') },[editando])
    const registrosFiltrados = registros.filter(item => (!filtroMesOS || String(item.criado_em || '').slice(0,7) === filtroMesOS) && (!filtroNumeroOS || normalizarBusca(item.numero_os).includes(normalizarBusca(filtroNumeroOS.trim()))))
    const selecionada = empresas.find(e=>String(e.id)===String(form.empresa_id))
    const resultados = empresas.filter(e=>normalizarBusca([e.nome_fantasia,e.razao_social,e.nome,e.cnpj,e.telefone,e.whatsapp].join(' ')).includes(normalizarBusca(busca))).slice(0,30)
    async function atualizarOS() {
      setCarregandoOS(true)
      const {data,error}=await supabase.from('ordens_servico').select('*').order('criado_em',{ascending:false})
      setCarregandoOS(false)
      if(error) {setMensagem('Não foi possível consultar as OS: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{atualizarOS()},[])
    useEffect(()=>{supabase.from('catalogo_itens').select('*').order('nome',{ascending:true}).then(({data,error})=>{if(!error)setItensCatalogo(data||[])})},[])
    function adicionarItemCatalogo() {
      const item=itensCatalogo.find(i=>String(i.id)===String(itemSelecionado))
      if(!item){setMensagem('Selecione um produto ou serviço cadastrado.');return}
      const qtd=Math.max(1,Math.floor(Number(quantidadeSelecionada)||1))
      const subtotal=(Number(item.preco)||0)*qtd
      const linha=qtd+' x '+item.nome+' — '+dinheiro(subtotal)
      setForm(v=>item.tipo==='Serviço'
        ?{...v,servicos:[v.servicos,linha].filter(Boolean).join('\n')}
        :{...v,pecas:[v.pecas,linha].filter(Boolean).join('\n'),produto:v.produto||item.nome,valor_produto:(Number(String(v.valor_produto).replace(',','.'))||0)+subtotal})
      setItemSelecionado('');setQuantidadeSelecionada('1');setMensagem('Item incluído. Confira o valor total antes de salvar.')
    }
    function escolherEmpresa(e) {
      setForm(v=>({...v,empresa_id:String(e.id)}))
      setBusca(e.nome_fantasia||e.razao_social||e.nome||'')
      setMostrarBusca(false)
    }
    async function salvar(e) {
      e.preventDefault()
      if(!form.empresa_id) {setMensagem('Selecione um cliente cadastrado na busca.');return}
      setSalvando(true);setMensagem('')
      const payload={numero_os:form.numero_os.trim(),empresa_id:form.empresa_id,servicos:form.servicos,pecas:form.pecas,produto:form.produto,valor_produto:Number(String(form.valor_produto).replace(',','.'))||0,valor:Number(String(form.valor).replace(',','.'))||0,forma_pagamento:form.forma_pagamento}
      const consulta=editando
        ?supabase.from('ordens_servico').update(payload).eq('id',editando)
        :supabase.from('ordens_servico').insert([payload])
      const {error}=await consulta
      setSalvando(false)
      if(error){setMensagem('Erro ao salvar OS: '+error.message);return}
      setForm(vazio);setBusca('');setEditando(null);setMensagem('OS salva com sucesso.')
      await atualizarOS()
    }

    function imprimirPedido(item) {
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))||{}
      const esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
      const campo=(titulo,valor)=>'<div class="campo"><small>'+esc(titulo)+'</small><strong>'+esc(valor||'—')+'</strong></div>'
      const bloco=(titulo,valor)=>'<section><h3>'+esc(titulo)+'</h3><div class="descricao">'+esc(valor||'Não informado')+'</div></section>'
      const data=item.criado_em?dataBR(item.criado_em):dataBR(new Date())
      const nome=cliente.nome_fantasia||cliente.razao_social||cliente.nome||'Cliente cadastrado'
      const total=dinheiro(item.valor)
      const logo=new URL(LOGO,window.location.href).href
      const html=`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pedido de Venda - OS ${esc(item.numero_os)}</title><style>
      @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#20262c;margin:0;font-size:12px}
      header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #19b983;padding-bottom:14px;gap:18px}
      header img{max-width:160px;max-height:78px;object-fit:contain}header .empresa{text-align:right}header .empresa b{font-size:19px;color:#126b54}
      header .empresa p{margin:5px 0;color:#444}h1{font-size:21px;margin:20px 0 5px}h2{font-size:13px;margin:0 0 12px;color:#555;font-weight:normal}
      h3{font-size:13px;background:#e8ecef;padding:9px;margin:18px 0 10px;border-left:4px solid #19b983}
      .grade{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.campo{padding:8px 0;border-bottom:1px solid #ddd;min-width:0;overflow-wrap:anywhere}
      small{display:block;font-size:10px;text-transform:uppercase;color:#666;margin-bottom:4px}.campo strong{font-size:12px;font-weight:600}
      .descricao{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;padding:4px 2px}
      .valor{margin-top:20px;padding:16px;background:#edf5f1;display:flex;justify-content:space-between;font-size:18px;font-weight:bold}
      footer{margin-top:55px;display:flex;gap:40px}footer div{flex:1;text-align:center;border-top:1px solid #777;padding-top:8px;color:#555}
      .acoes{margin:18px 0;display:flex;gap:8px}.acoes button{padding:10px 16px;background:#168b69;color:white;border:0;border-radius:5px;cursor:pointer}
      @media print{.acoes{display:none}header,.valor,h3{-webkit-print-color-adjust:exact;print-color-adjust:exact}section{break-inside:avoid}}
      </style></head><body>
      <div class="acoes"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div>
      <header><img src="${esc(logo)}" alt="Logo Central Truck"><div class="empresa"><b>CENTRAL TRUCK SERVICE</b><p>Oficina especializada em linha diesel</p><p>Contagem - MG</p><p>WhatsApp: (31) 97525-5079</p></div></header>
      <h1>PEDIDO DE VENDA</h1><h2>Ordem de Serviço nº ${esc(item.numero_os)} • Emissão: ${esc(data)}</h2>
      <h3>DADOS DO CLIENTE</h3><div class="grade">
      ${campo('Cliente / Empresa',nome)}${campo('CNPJ',cliente.cnpj)}${campo('Telefone',cliente.telefone||cliente.whatsapp)}
      ${campo('E-mail',cliente.email)}${campo('Cidade / UF',[cliente.cidade,cliente.estado].filter(Boolean).join(' / '))}
      </div>
      ${bloco('SERVIÇOS',item.servicos)}${bloco('PEÇAS E QUANTIDADES',item.pecas)}
      <h3>PRODUTO</h3><div class="grade">${campo('Produto',item.produto)}${campo('Valor do produto',dinheiro(item.valor_produto))}</div>
      <h3>CONDIÇÕES COMERCIAIS</h3><div class="grade">${campo('Forma de pagamento',item.forma_pagamento)}${campo('Data do cadastro',data)}</div>
      <div class="valor"><span>VALOR INFORMADO DA OS</span><span>${esc(total)}</span></div>
      <footer><div>Responsável Central Truck</div><div>Cliente / Responsável</div></footer>
      </body></html>`
      const janela=window.open('','_blank')
      if(!janela){setMensagem('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');return}
      janela.document.open();janela.document.write(html);janela.document.close()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({numero_os:item.numero_os||'',empresa_id:String(item.empresa_id||''),servicos:item.servicos||'',pecas:item.pecas||'',produto:item.produto||'',valor_produto:String(item.valor_produto??''),valor:String(item.valor??''),forma_pagamento:item.forma_pagamento||''})
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))
      setBusca(cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'')
      setMensagem('')
    }
    return <>
      <div className="page-title"><div><h1>Ordens de Serviço</h1><p>Cadastro de OS com vínculo aos clientes existentes.</p></div></div>
      <section className="panel">
        <h2>{editando?'Editar OS':'Nova Ordem de Serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Número da OS *<input required value={form.numero_os} onChange={e=>setForm(v=>({...v,numero_os:e.target.value}))} placeholder="Ex.: 266"/></label>
            <label>Buscar cliente cadastrado *
              <input value={busca} onFocus={()=>setMostrarBusca(true)} onChange={e=>{setBusca(e.target.value);setForm(v=>({...v,empresa_id:''}));setMostrarBusca(true)}} placeholder="Digite nome, CNPJ ou telefone" autoComplete="off"/>
            </label>
          </div>
          {mostrarBusca && <div className="panel" style={{maxHeight:210,overflowY:'auto',padding:8,marginBottom:12}}>
            {resultados.map(e=><button type="button" key={e.id} onClick={()=>escolherEmpresa(e)} style={{display:'block',width:'100%',textAlign:'left',marginBottom:5,background:'#555b63',color:'#fff',border:'1px solid #707780',borderRadius:7}}>{e.nome_fantasia||e.razao_social||e.nome||'Cliente'} — {e.cnpj||e.telefone||e.whatsapp||'Cadastro existente'}</button>)}
            {!resultados.length && <p>Nenhum cliente encontrado. Cadastre em Empresas / Leads.</p>}
          </div>}
          {selecionada && <div className="panel" style={{marginBottom:14,padding:12}}>
            <strong>Cliente vinculado: {selecionada.nome_fantasia||selecionada.razao_social||selecionada.nome}</strong>
            <p>CNPJ: {selecionada.cnpj||'—'} | Telefone: {selecionada.telefone||'—'} | WhatsApp: {selecionada.whatsapp||'—'}</p>
            <p>E-mail: {selecionada.email||'—'} | Cidade: {selecionada.cidade||'—'} / {selecionada.estado||'—'}</p>
          </div>}
          <div className="panel" style={{marginBottom:14,padding:12}}>
            <h3>Adicionar produto ou serviço cadastrado</h3>
            <div className="form-grid">
              <label>Item<select value={itemSelecionado} onChange={e=>setItemSelecionado(e.target.value)}><option value="">Selecione um item</option>{itensCatalogo.map(item=><option key={item.id} value={item.id}>{item.tipo} — {item.nome} — {dinheiro(item.preco)}</option>)}</select></label>
              <label>Quantidade<input type="number" min="1" step="1" value={quantidadeSelecionada} onChange={e=>setQuantidadeSelecionada(e.target.value)}/></label>
            </div>
            <button type="button" onClick={adicionarItemCatalogo}>Adicionar à OS</button>
          </div>
          <div className="form-grid">
            <label>Serviços<textarea rows={4} value={form.servicos} onChange={e=>setForm(v=>({...v,servicos:e.target.value}))} placeholder="Descreva os serviços"/></label>
            <label>Peças<textarea rows={4} value={form.pecas} onChange={e=>setForm(v=>({...v,pecas:e.target.value}))} placeholder="Peças e quantidades"/></label>
            <label>Produto<input value={form.produto} onChange={e=>setForm(v=>({...v,produto:e.target.value}))} placeholder="Nome do produto"/></label>
            <label>Valor do produto (R$)<input type="number" min="0" step="0.01" value={form.valor_produto} onChange={e=>setForm(v=>({...v,valor_produto:e.target.value}))} placeholder="0,00"/></label>
            <label>Valor (R$)<input type="number" min="0" step="0.01" value={form.valor} onChange={e=>setForm(v=>({...v,valor:e.target.value}))}/></label>
            <label>Forma de pagamento<select value={form.forma_pagamento} onChange={e=>setForm(v=>({...v,forma_pagamento:e.target.value}))}>
              <option value="">Selecione</option><option>Pix</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Boleto</option><option>Ticklog</option><option>Faturado</option><option>Transferência bancária</option><option>Outro</option>
            </select></label>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Salvar OS'}</button>
            <button type="button" onClick={()=>{if(!form.numero_os.trim()||!form.empresa_id){setMensagem("Informe o número da OS e selecione um cliente para gerar o pedido.");return} imprimirPedido({...form,numero_os:form.numero_os.trim(),valor:Number(String(form.valor).replace(",","."))||0,valor_produto:Number(String(form.valor_produto).replace(",","."))||0})}} style={{background:"#555b63",color:"#fff",border:"1px solid #737b83",borderRadius:8,padding:"10px 16px",cursor:"pointer"}}>Imprimir / Salvar PDF</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio);setBusca('')}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>OS cadastradas <button type="button" onClick={atualizarOS}>Atualizar</button></h2>
        <div className="form-grid" style={{marginBottom:14}}>
          <label>Buscar por número da OS<input value={filtroNumeroOS} onChange={e=>setFiltroNumeroOS(e.target.value)} placeholder="Ex.: 267" /></label>
          <label>Filtrar por mês<input type="month" value={filtroMesOS} onChange={e=>setFiltroMesOS(e.target.value)} /></label>
        </div>
        {(filtroMesOS || filtroNumeroOS) && <button type="button" onClick={()=>{setFiltroMesOS('');setFiltroNumeroOS('')}} style={{marginBottom:12}}>Limpar filtros</button>}
        {carregandoOS?<p>Carregando...</p>:<table><thead><tr><th>OS</th><th>Cliente</th><th>Serviços</th><th>Peças</th><th>Produto</th><th>Valor do produto</th><th>Valor</th><th>Pagamento</th><th>Ações</th></tr></thead>
          <tbody>{registrosFiltrados.map(item=>{const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id));return <tr key={item.id}>
            <td>{item.numero_os}</td><td>{cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'Cliente cadastrado'}</td>
            <td>{item.servicos}</td><td>{item.pecas}</td><td>{item.produto||'—'}</td><td>{dinheiro(item.valor_produto)}</td><td>{dinheiro(item.valor)}</td><td>{item.forma_pagamento}</td>
            <td><button type="button" onClick={()=>editar(item)}>Editar</button> <button type="button" onClick={()=>imprimirPedido(item)}>Pedido / PDF / Imprimir</button></td>
          </tr>})}{!registrosFiltrados.length&&<tr><td colSpan={9}>Nenhuma OS encontrada para os filtros selecionados.</td></tr>}</tbody></table>}
      </section>
    </>
  }


  function Catalogo() {
    const vazio = {tipo:'Produto',nome:'',preco:'',custo:'',preco_manual:false,quantidade_caixa:'10',quantidade_estoque:'',fornecedor:''}
    const [form,setForm] = useState(vazio)
    const [registros,setRegistros] = useState([])
    const [editando,setEditando] = useState(null)
    const [busca,setBusca] = useState('')
    const [tipoFiltro,setTipoFiltro] = useState('Todos')
    const [salvando,setSalvando] = useState(false)
    const [excluindo,setExcluindo] = useState(null)
    const [carregando,setCarregando] = useState(false)
    const [mensagem,setMensagem] = useState('')
    async function carregar() {
      setCarregando(true)
      const {data,error}=await supabase.from('catalogo_itens').select('*').order('nome',{ascending:true})
      setCarregando(false)
      if(error){setMensagem('Erro ao consultar cadastro: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{carregar()},[])
    async function salvar(e) {
      e.preventDefault()
      setSalvando(true);setMensagem('')
      const payload={
        tipo:form.tipo,nome:form.nome.trim(),
        preco:Number(String(form.preco).replace(',','.'))||0,
        custo:Number(String(form.custo).replace(',','.'))||0,
        quantidade_caixa:form.tipo==='Produto'?Math.max(1,Number(form.quantidade_caixa)||1):1,
        quantidade_estoque:form.tipo==='Produto'?Math.max(0,Number(form.quantidade_estoque)||0):0,
        fornecedor:form.fornecedor.trim()
      }
      const {error}=editando
        ?await supabase.from('catalogo_itens').update(payload).eq('id',editando)
        :await supabase.from('catalogo_itens').insert([payload])
      setSalvando(false)
      if(error){setMensagem('Não foi possível salvar: '+error.message);return}
      setForm(vazio);setEditando(null);setMensagem('Cadastro salvo com sucesso.');await carregar()
    }
    async function excluir(item) {
      if(!window.confirm('Excluir definitivamente "'+item.nome+'" do cadastro de produtos e serviços?'))return
      setExcluindo(item.id);setMensagem('')
      const {error}=await supabase.from('catalogo_itens').delete().eq('id',item.id)
      setExcluindo(null)
      if(error){setMensagem('Não foi possível excluir: '+error.message);return}
      if(String(editando)===String(item.id)){setEditando(null);setForm(vazio)}
      setMensagem('Cadastro excluído com sucesso.')
      await carregar()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({tipo:item.tipo||'Produto',nome:item.nome||'',preco:String(item.preco??''),custo:String(item.custo??''),preco_manual:true,quantidade_caixa:String(item.quantidade_caixa??10),quantidade_estoque:String(item.quantidade_estoque??0),fornecedor:item.fornecedor||''})
      window.scrollTo({top:0,behavior:'smooth'})
    }
    const filtrados=registros.filter(item=>(tipoFiltro==='Todos'||item.tipo===tipoFiltro)&&normalizarBusca([item.nome,item.fornecedor].join(' ')).includes(normalizarBusca(busca)))
    return <>
      <div className="page-title"><div><h1>Cadastro de Produtos e Serviços</h1><p>Catálogo de preços, fornecedores e quantidades da Central Truck.</p></div></div>
      <section className="panel" style={{marginBottom:18}}>
        <h2>Buscar produtos e serviços</h2>
        <div className="form-grid">
          <label>Pesquisar produto, serviço ou fornecedor<input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Digite o nome do produto ou serviço"/></label>
          <label>Mostrar<select value={tipoFiltro} onChange={e=>setTipoFiltro(e.target.value)}><option>Todos</option><option>Produto</option><option>Serviço</option></select></label>
        </div>
        <p style={{marginTop:10,fontSize:13}}>{filtrados.length} cadastro(s) encontrado(s). {busca||tipoFiltro!=='Todos'?'Veja os resultados na lista abaixo.':'Pesquise para localizar um item já cadastrado.'}</p>
        {(busca||tipoFiltro!=='Todos')&&<button type="button" onClick={()=>{setBusca('');setTipoFiltro('Todos')}}>Limpar busca</button>}
      </section>
      <section className="panel">
        <h2>{editando?'Editar cadastro':'Novo produto ou serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Tipo *<select value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))}><option>Produto</option><option>Serviço</option></select></label>
            <label>Nome / descrição *<input required value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))} placeholder="Ex.: Filtro ARLA ou Diagnóstico eletrônico"/></label>
            <label>Valor de custo (R$)<input type="number" min="0" step="0.01" value={form.custo} onChange={e=>setForm(v=>{const custo=e.target.value;const valor=Number(custo)||0;return {...v,custo,preco:v.preco_manual?v.preco:(custo===''?'':(Math.round(valor*1.7*100)/100).toFixed(2))}})} placeholder="0,00"/></label>
            <label>Valor de venda (R$) *<input required type="number" min="0" step="0.01" value={form.preco} onChange={e=>setForm(v=>({...v,preco:e.target.value,preco_manual:true}))} placeholder="Calculado com 70% sobre o custo"/></label>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',paddingBottom:10}}>
              <span style={{fontSize:12}}>Venda sugerida: custo + 70%. Você pode alterar o preço.</span>
              <button type="button" onClick={()=>setForm(v=>({...v,preco_manual:false,preco:v.custo===''?'':(Math.round((Number(v.custo)||0)*1.7*100)/100).toFixed(2)}))}>Aplicar +70%</button>
            </div>
            <label>Fornecedor<input value={form.fornecedor} onChange={e=>setForm(v=>({...v,fornecedor:e.target.value}))} placeholder="Nome do fornecedor"/></label>
            {form.tipo==='Produto' && <>
              <label>Unidades por caixa<input type="number" min="1" step="1" value={form.quantidade_caixa} onChange={e=>setForm(v=>({...v,quantidade_caixa:e.target.value}))} placeholder="10"/></label>
              <label>Quantidade em estoque (unidades)<input type="number" min="0" step="1" value={form.quantidade_estoque} onChange={e=>setForm(v=>({...v,quantidade_estoque:e.target.value}))} placeholder="0"/></label>
            </>}
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Cadastrar'}</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio)}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>Produtos e serviços cadastrados <button type="button" onClick={carregar}>Atualizar</button></h2>

        {carregando?<p>Carregando...</p>:<table><thead><tr><th>Tipo</th><th>Produto / Serviço</th><th>Custo</th><th>Venda</th><th>Unid. / caixa</th><th>Estoque</th><th>Fornecedor</th><th>Ações</th></tr></thead><tbody>
          {filtrados.map(item=><tr key={item.id}><td>{item.tipo}</td><td>{item.nome}</td><td>{dinheiro(item.custo)}</td><td>{dinheiro(item.preco)}</td><td>{item.tipo==='Produto'?item.quantidade_caixa:'—'}</td><td>{item.tipo==='Produto'?item.quantidade_estoque:'—'}</td><td>{item.fornecedor||'—'}</td><td><div className="actions"><button type="button" className="btn-editar" onClick={()=>editar(item)}>Editar</button><button type="button" className="btn-excluir" disabled={excluindo===item.id} onClick={()=>excluir(item)}>{excluindo===item.id?"Excluindo...":"Excluir"}</button></div></td></tr>)}
          {!filtrados.length&&<tr><td colSpan={8}>Nenhum cadastro encontrado.</td></tr>}
        </tbody></table>}
      </section>
    </>
  }

  function Conteudo() {
    if (pagina === 'dashboard') return <Dashboard />
    if (pagina === 'empresas') return <Empresas />
    if (pagina === 'funil') return <Funil />
    if (pagina === 'oportunidades') return <Oportunidades />
    if (pagina === 'atendimentos') return <Atendimentos />
    if (pagina === 'agenda') return <Agenda />
    if (pagina === 'orcamentos') return <Orcamentos />
    if (pagina === 'ordens-servico') return <OrdensServico />
    if (pagina === 'catalogo') return <Catalogo />
    if (pagina === 'relatorios') return <Relatorios />
    if (pagina === 'importar') return <ImportarContatos />
    if (pagina === 'configuracoes') return <Configuracoes />
    return <Dashboard />
  }

  return (
    <div className="crm">
      <aside className="sidebar">
        <div className="brand">
          <a href="#" aria-label="Ir para o Dashboard" title="Voltar ao Dashboard" onClick={(event) => { event.preventDefault(); setPagina("dashboard") }} style={{ display: "inline-flex", cursor: "pointer" }}>
            <LogoMark className="brand-logo" />
          </a>
        </div>

        <nav>
          {MENU.map(([id, icone, nome]) => (
            <button
              key={id}
              className={pagina === id ? 'active' : ''}
              onClick={() => setPagina(id)}
            >
              <span>{icone}</span>
              {nome}
            </button>
          ))}
          <button type="button" className="logout-btn" onClick={sair} style={{ width: "100%", marginTop: "12px", textAlign: "left" }}>⇥&nbsp; Sair</button>
        </nav>

        <div className="sidebar-footer">
          <div className="online-dot"></div>
          <div>
            <b>Central Truck</b>
            <span>Sistema online</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="reference-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"24px",flexWrap:"nowrap",position:"relative",width:"100%",boxSizing:"border-box"}}>
          <div className="reference-brand" style={{flex:"0 1 auto",minWidth:0}}>
            <div className="reference-brand-name" style={{fontSize:"clamp(20px, 2.5vw, 34px)",fontWeight:900,letterSpacing:"0.015em",lineHeight:1.05,whiteSpace:"nowrap"}}>CENTRAL TRUCK <span style={{fontSize:"0.46em",letterSpacing:"0.12em",verticalAlign:"middle",whiteSpace:"nowrap"}}>★ SERVICE ★</span></div>
          </div>
          <a className="commercial-phone reference-whatsapp" style={{position:"absolute",right:"18px",top:"50%",transform:"translateY(-50%)",margin:0,flexShrink:0,display:"flex",alignItems:"center",gap:"10px"}} href="https://wa.me/5531975255079" target="_blank" rel="noreferrer">
            <img className="whatsapp-logo-img" src={ZAP_LOGO} alt="WhatsApp" />
            <span className="commercial-copy"><strong>(31) 97525-5079</strong></span>
          </a>
        </header>

        <div className="content">
          {erro && (
            <div className="error-box">
              <b>Não foi possível acessar os dados do Supabase.</b>
              <span>{erro}</span>
              <button onClick={carregarDados}>Tentar novamente</button>
            </div>
          )}

          {carregando ? (
            <div className="loading">
              <div className="loader"></div>
              <b>Carregando Central Truck CRM...</b>
              <span>Buscando informações do banco de dados.</span>
            </div>
          ) : (
            <Conteudo />
          )}
        </div>
      </main>
    </div>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento #root não encontrado no index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
),'Valor Vendido nos Últimos 30 Dias', dinheiro(valorUltimos30Dias)],
      ['R$','Valor em Oportunidades', dinheiro(valorOportunidades)],
      ['↗','Valor Vendido', dinheiro(valorVendido)],
      ['%','Conversão', `${conversao}%`],
      ['◷','Retornos Atrasados', atrasadas],
    ]
    return (
      <div className="dashboard-premium">
        <section className="dash-hero">
          <div>
            <small>Central Truck Service</small>
            <h1>Dashboard Comercial</h1>
            <p>Visão geral da operação comercial Truck exclusivo Danielle</p>
            <button className="primary" onClick={carregarDados}>↻ Atualizar dados</button>
          </div>
          <div className="hero-watermark hero-driving-scene"><img className="hero-truck-image" src={`${import.meta.env.BASE_URL}Caminhão Volvo FH 540 no Galpão Industrial.png`} alt="Volvo FH 540 em movimento" /><span className="truck-motion-streak streak-one" aria-hidden="true"></span><span className="truck-motion-streak streak-two" aria-hidden="true"></span><span className="truck-motion-streak streak-three" aria-hidden="true"></span></div>
        </section>

        <section className="kpi-grid">
          {kpis.map(([icone,titulo,valor]) => (
            <div className="kpi-card clickable-card" key={titulo} role="button" tabIndex="0" onClick={() => { const destinos={'Total de Leads':'empresas','Em Negociação':'funil','Vendas Realizadas':'orcamentos','Valor em Oportunidades':'orcamentos','Valor Vendido':'orcamentos','Conversão':'relatorios','Retornos Atrasados':'agenda'}; setPagina(destinos[titulo] || 'dashboard') }} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')e.currentTarget.click()}}>
              <div className="kpi-icon">{icone}</div>
              <span>{titulo}</span>
              <strong>{valor}</strong>
              <small><b>Central Truck</b> · atualizado</small>
            </div>
          ))}
        </section>

        <div className="dashboard-lower">
          <section className="panel strategic-panel clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('oportunidades')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('oportunidades')}}>
            <div className="panel-heading"><div><h2>Serviços Estratégicos</h2><p>Principais soluções oferecidas pela Central Truck.</p></div></div>
            <div className="service-premium-grid">
              <img
                className="strategic-services-image"
                src={`${import.meta.env.BASE_URL}servicos-estrategicos.jpg`}
                alt="Serviços Estratégicos da Central Truck"
              />
            </div>
          </section>
          <section className="panel commercial-chart clickable-panel" role="button" tabIndex="0" onClick={()=>setPagina('relatorios')} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')setPagina('relatorios')}}>
            <div className="panel-heading"><div><h2>Resumo Comercial</h2><p>Evolução das vendas e oportunidades.</p></div></div>
            <div className="mini-bars">
              <div><span>Leads</span><i style={{height:`${Math.min(100,Math.max(8,empresas.length*12))}%`}}></i><b>{empresas.length}</b></div>
              <div><span>Oportunidades</span><i style={{height:`${Math.min(100,Math.max(8,oportunidades.length*16))}%`}}></i><b>{oportunidades.length}</b></div>
              <div><span>Vendas finalizadas</span><i style={{height:`${Math.min(100,Math.max(8,vendas.length*22))}%`}}></i><b>{vendas.length}</b></div>
              <div><span>Orçamentos</span><i style={{height:`${Math.min(100,Math.max(8,orcamentos.length*18))}%`}}></i><b>{orcamentos.length}</b></div>
            </div>
          </section>
        </div>

        <div className="dashboard-lower">
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Últimos Leads</h2><p>Empresas cadastradas recentemente.</p></div><button onClick={()=>setPagina('empresas')}>Ver todos →</button></div>
            {ultimosLeads.length ? ultimosLeads.map((e)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={e.id} onClick={()=>setPagina('empresas')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('empresas')}}><span className="list-avatar">{(e.nome_fantasia||e.nome||'C')[0]}</span><div><b>{e.nome_fantasia||e.nome}</b><small>{e.status||'Lead novo'}</small></div><em>{e.classificacao||'B'}</em></div>) : <div className="dash-empty">Nenhum lead cadastrado.</div>}
          </section>
          <section className="panel compact-panel">
            <div className="panel-heading"><div><h2>Agenda vinculada</h2><p>{tarefas.length} tarefa(s) cadastrada(s) • {proximasTarefas.length} próxima(s) exibida(s).</p></div><button onClick={()=>setPagina('agenda')}>Ver agenda →</button></div>
            {proximasTarefas.length ? proximasTarefas.map((t)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={t.id} onClick={()=>setPagina('agenda')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('agenda')}}><span className="list-avatar">◷</span><div><b>{t.titulo}</b><small>{nomeEmpresa(t.empresa_id)} · {dataBR(t.data_hora)}</small></div><em>{t.prioridade||'Normal'}</em></div>) : <div className="dash-empty">Nenhuma tarefa encontrada no banco de dados. Abra a Agenda para cadastrar ou atualizar.</div>}
          </section>
        </div>
      </div>
    )
  }

 async function baixarPlanilhaClientes() {
  if (!empresas.length) { alert('Não há clientes cadastrados para baixar.'); return }

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Central Truck Service'
  workbook.created = new Date()
  const ws = workbook.addWorksheet('Clientes', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
    },
    views: [{ state: 'frozen', ySplit: 6 }]
  })

  const colunas = [
    ['Empresa',28],['Nome fantasia',28],['CNPJ',20],['Classificação',14],
    ['Segmento',20],['Cidade',20],['Estado',10],['Telefone',18],
    ['WhatsApp',18],['E-mail',30],['Site',28],['Status',20],
    ['Data do cadastro',18],['Observações',40]
  ]
  ws.columns = colunas.map(([header,width]) => ({ header, width }))
  ws.spliceRows(1, 1)
  ws.mergeCells('A1:N3')
  ws.mergeCells('A4:N4')
  ws.mergeCells('A5:N5')
  ws.getCell('A1').value = 'CENTRAL TRUCK SERVICE'
  ws.getCell('A4').value = 'RELATÓRIO DE CLIENTES / LEADS'
  ws.getCell('A5').value = 'Gestão Comercial • Exportado em ' + new Date().toLocaleString('pt-BR')

  const verde = 'FF19E6A2', escuro = 'FF061914', escuro2 = 'FF0B2A21', branco = 'FFFFFFFF', cinza = 'FFDCE9E4'
  ;['A1','A4','A5'].forEach((ref) => {
    ws.getCell(ref).alignment = { vertical:'middle', horizontal:'center' }
    ws.getCell(ref).fill = { type:'pattern', pattern:'solid', fgColor:{argb:escuro} }
    ws.getCell(ref).font = { color:{argb: ref==='A4' ? verde : branco}, bold:true, size: ref==='A1' ? 24 : ref==='A4' ? 16 : 10 }
  })
  ws.getRow(1).height = 32; ws.getRow(2).height = 18; ws.getRow(3).height = 18
  ws.getRow(4).height = 26; ws.getRow(5).height = 22

  const headerRow = ws.getRow(6)
  colunas.forEach(([titulo],i) => headerRow.getCell(i+1).value = titulo)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:verde} }
    cell.font = { color:{argb:'FF00140E'}, bold:true, size:10 }
    cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true }
    cell.border = { bottom:{style:'medium',color:{argb:'FF00A875'}} }
  })

  empresas.forEach((empresa,idx) => {
    const row = ws.addRow([
      empresa.nome || '', empresa.nome_fantasia || '', empresa.cnpj || '',
      empresa.classificacao || '', empresa.segmento || '', empresa.cidade || '',
      empresa.estado || '', empresa.telefone || '', empresa.whatsapp || '',
      empresa.email || '', empresa.site || '', empresa.status || '',
      dataBR(empresa.criado_em), empresa.observacoes || ''
    ])
    row.height = 24
    row.eachCell({includeEmpty:true}, (cell) => {
      cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb: idx%2===0 ? 'FFF5FAF8' : branco} }
      cell.font = { color:{argb:'FF17352C'}, size:10 }
      cell.alignment = { vertical:'middle', wrapText:true }
      cell.border = { bottom:{style:'thin',color:{argb:cinza}} }
    })
  })

  ws.autoFilter = { from:'A6', to:'N' + (empresas.length + 6) }
  ws.headerFooter.oddHeader = '&C&B CENTRAL TRUCK SERVICE'
  ws.headerFooter.oddFooter = '&LRelatório de Clientes&CConfidencial&R&P de &N'
  ws.pageSetup.printTitlesRow = '1:6'
  ws.pageSetup.printArea = 'A1:N' + (empresas.length + 6)

  try {
    const resposta = await fetch(LOGO)
    const blob = await resposta.blob()
    const base64 = await new Promise((resolve,reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const ext = blob.type.includes('png') ? 'png' : 'jpeg'
    const logoId = workbook.addImage({ base64, extension:ext })
    ws.addImage(logoId, { tl:{col:0.15,row:0.15}, ext:{width:125,height:72}, editAs:'oneCell' })
  } catch (e) { console.warn('Logo não inserida no Excel:', e) }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'Clientes_Central_Truck_' + new Date().toISOString().slice(0,10) + '.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

function Empresas() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const formularioEmpresaRef = React.useRef(null)
  const [salvando, setSalvando] = useState(false)
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
   const [empresaEditando, setEmpresaEditando] = useState(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState([])
  const [buscaEmpresa, setBuscaEmpresa] = useState('')
  const [filtroStatusEmpresa, setFiltroStatusEmpresa] = useState('')
  const [buscaAgenda, setBuscaAgenda] = useState('')
  const [form, setForm] = useState({
    nome: '',
    nome_fantasia: '',
    pessoa_contato: '',
    cnpj: '',
    segmento: '',
    classificacao: 'B',
    status: 'Lead novo',
    cidade: '',
    estado: 'MG',
    telefone: '',
    whatsapp: '',
    email: '',
    site: '',
    observacoes: ''
  })

  function limparCadastro() {
    sessionStorage.removeItem('empresa_rascunho')
    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    setEmpresaEditando(null)
    setForm({
      nome: '', nome_fantasia: '', pessoa_contato: '', cnpj: '',
      segmento: '', classificacao: 'B', status: 'Lead novo',
      cidade: '', estado: 'MG', telefone: '', whatsapp: '',
      email: '', site: '', observacoes: ''
    })
  }

  useEffect(() => {
    const rascunho = sessionStorage.getItem('centraltruck_empresa_em_edicao')
    if (rascunho) {
      try {
        const dados = JSON.parse(rascunho)
        if (dados && typeof dados === 'object') {
          setForm(dados)
          setMostrarFormulario(true)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (mostrarFormulario && !empresaEditando && form.nome.trim()) {
      sessionStorage.setItem('centraltruck_empresa_em_edicao', JSON.stringify(form))
    }
  }, [form, mostrarFormulario, empresaEditando])

  function alterarCampo(e) {
    const { name, value } = e.target
    setForm((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }
function editarEmpresa(empresa) {
  setEmpresaEditando(empresa)

  setForm({
    nome: empresa.nome || '',
    nome_fantasia: empresa.nome_fantasia || '',
    pessoa_contato: empresa.pessoa_contato || '',
    cnpj: empresa.cnpj || '',
    segmento: empresa.segmento === 'Diesel' ? 'Oficina - Diesel' : (empresa.segmento || ''),
    classificacao: empresa.classificacao || 'B',
    status: empresa.status || 'Lead novo',
    cidade: empresa.cidade || '',
    estado: empresa.estado || 'MG',
    telefone: empresa.telefone || '',
    whatsapp: empresa.whatsapp || '',
    email: empresa.email || '',
    site: empresa.site || '',
    observacoes: empresa.observacoes || ''
  })

  setMensagem('')
  setMostrarFormulario(true)
  requestAnimationFrame(() => {
    formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
async function excluirSelecionados() {
  if (!leadsSelecionados.length) {
    alert('Selecione pelo menos um Lead.')
    return
  }
  if (!window.confirm('Excluir os ' + leadsSelecionados.length + ' Leads selecionados?')) return

  const lote = 100
  for (let inicio = 0; inicio < leadsSelecionados.length; inicio += lote) {
    const ids = leadsSelecionados.slice(inicio, inicio + lote)

    const funil = await supabase.from('oportunidades').delete().in('empresa_id', ids)
    if (funil.error) {
      alert('Erro ao limpar os vínculos do Funil: ' + funil.error.message)
      await carregarDados()
      return
    }

    const resultado = await supabase.from('empresas').delete().in('id', ids)
    if (resultado.error) {
      alert('Erro ao excluir os Leads selecionados: ' + resultado.error.message)
      await carregarDados()
      return
    }
  }

  setLeadsSelecionados([])
  await carregarDados()
  alert('Leads selecionados excluídos com sucesso.')
}

async function excluirEmpresa(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir esta empresa? Esta ação não poderá ser desfeita.'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('Erro ao excluir empresa: ' + error.message)
    return
  }

  await carregarDados()
}
  async function salvarEmpresa(e) {
    e.preventDefault()

    if (!form.nome.trim()) {
      setMensagem('Informe o nome da empresa.')
      return
    }

    setSalvando(true)
    setMensagem('')

    const { pessoa_contato, ...camposBanco } = form
    const dados = {
      ...camposBanco,
      nome: form.nome.trim(),
      nome_fantasia: form.nome_fantasia.trim() || null,
      cnpj: form.cnpj.trim() || null,
      segmento: form.segmento.trim() || null,
      cidade: form.cidade.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      observacoes: form.observacoes.trim() || null
    }

    let resultado

if (empresaEditando) {
  resultado = await supabase
    .from('empresas')
    .update(dados)
    .eq('id', empresaEditando.id)
} else {
  resultado = await supabase
    .from('empresas')
    .insert([dados])
    .select('id')
}

const { error } = resultado


    if (error) {
      console.error(error)
      setMensagem('Erro ao cadastrar empresa: ' + error.message)
      setSalvando(false)
      return
    }

    setMensagem(empresaEditando ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!')
    sessionStorage.removeItem('empresa_rascunho')

    setForm({
      nome: '',
      nome_fantasia: '',
      pessoa_contato: '',
      cnpj: '',
      segmento: '',
      classificacao: 'B',
      status: 'Lead novo',
      cidade: '',
      estado: 'MG',
      telefone: '',
      whatsapp: '',
      email: '',
      site: '',
      observacoes: ''
    })

    sessionStorage.removeItem('centraltruck_empresa_em_edicao')
    await carregarDados()
    setSalvando(false)
    setEmpresaEditando(null)
    // Manter o formulario aberto e limpo para o proximo cadastro.
    setMostrarFormulario(true)
    requestAnimationFrame(() => {
      formularioEmpresaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Empresas / Leads</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.4' }}>Base comercial de clientes e potenciais clientes.</p>
        </div>

        <button
          className="primary"
          onClick={() => {
            setMensagem('')
            if (mostrarFormulario) {
              setMostrarFormulario(false)
              limparCadastro()
            } else {
              limparCadastro()
              setMostrarFormulario(true)
            }
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nova Empresa'}
        </button>
        <button type="button" className="btn-exportar" onClick={baixarPlanilhaClientes}>
          ↓ Baixar planilha de clientes
        </button>
      </div>

      {mensagem && (
        <section className="panel" style={{ marginBottom: '16px' }}>
          <strong>{mensagem}</strong>
        </section>
      )}

      {mostrarFormulario && (
        <section ref={formularioEmpresaRef} className="panel" style={{ marginBottom: '20px', scrollMarginTop: '24px' }}>
          <h2>{empresaEditando ? 'Editar Empresa' : 'Nova Empresa'}</h2>

          <form onSubmit={salvarEmpresa}>
            <div className="form-grid">
              <label>
                Nome da empresa *
                <input
                  name="nome"
                  value={form.nome}
                  onChange={alterarCampo}
                  required
                />
              </label>

              <label>
                Pessoa de contato
                <input
                  name="pessoa_contato"
                  value={form.pessoa_contato}
                  onChange={alterarCampo}
                  placeholder="Ex.: Gustavo"
                />
              </label>

              <label>
                CNPJ
                <input
                  name="cnpj"
                  value={form.cnpj}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Segmento
                <select
                  name="segmento"
                  value={form.segmento}
                  onChange={alterarCampo}
                >
                  <option value="">Selecione o segmento</option>
                  <option value="Transportadora">Transportadora</option>
                  <option value="Frota Própria">Frota Própria</option>
                  <option value="Frota Terceirizada">Frota Terceirizada</option>
                  <option value="Troca de Óleo">Troca de Óleo</option>
                  <option value="Oficina - Diesel">Oficina - Diesel</option>
                  <option value="Elétrica">Elétrica</option>
                  <option value="Pessoa Física">Pessoa Física</option>
                </select>
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={alterarCampo}
                >
                  <option>Lead novo</option>
                  <option>Primeiro contato</option>
                  <option>Interessado</option>
                  <option>Visita agendada</option>
                  <option>Orçamento enviado</option>
                  <option>Em negociação</option>
                  <option>Venda realizada</option>
                  <option>Venda perdida</option>
                  <option>Pós-venda</option>
                  <option>Já é cliente</option>
                  <option>Concorrente</option>
                  <option>Futuro parceiro</option>
                  <option>Não atendeu, ligar novamente</option>
                  <option>Cliente de outro vendedor</option>
                  </select>
              </label>

              <label>
                Cidade
                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                Estado
                <input
                  name="estado"
                  value={form.estado}
                  onChange={alterarCampo}
                  maxLength="2"
                />
              </label>

              <label>
                Telefone
                <input
                  name="telefone"
                  value={form.telefone}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                WhatsApp
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={alterarCampo}
                />
              </label>
            </div>

            <label style={{ display: 'block', marginTop: '14px' }}>
              Observações
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={alterarCampo}
                rows="4"
              />
            </label>

            <div style={{ marginTop: '12px', color: 'var(--muted)', fontSize: '13px' }}>Após salvar, você poderá selecionar esta empresa na seção “Agendar novo contato” abaixo.</div>
            <div style={{ marginTop: '16px' }}>
              <button
                className="primary"
                type="submit"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Empresa'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel" style={{ marginBottom: '16px' }}>
        <h3>Agendar novo contato</h3>
        <p>Selecione uma empresa cadastrada para criar um retorno diretamente na Agenda.</p>
        <input aria-label="Buscar empresa para agendar" placeholder="🔎 Buscar empresa pelo nome..." value={buscaAgenda} onChange={e => setBuscaAgenda(e.target.value)} style={{width:'100%',maxWidth:'480px',marginBottom:'8px'}} />
        <select id="empresa-agenda-rapida" defaultValue="" style={{ width: '100%', maxWidth: '480px', marginRight: '12px' }}>
          <option value="">Selecione uma empresa</option>
          {empresas.filter(empresa => normalizarBusca(empresa.nome_fantasia || empresa.nome).includes(normalizarBusca(buscaAgenda))).map(empresa => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia || empresa.nome}</option>)}
        </select>
        <button type="button" className="primary" style={{ background: '#444B54', backgroundColor: '#444B54', color: '#FFFFFF', border: '1px solid #626A74' }} onClick={() => {
          const id = document.getElementById('empresa-agenda-rapida')?.value
          if (!id) { alert('Selecione uma empresa antes de agendar.'); return }
          sessionStorage.setItem('centraltruck_agendar_empresa', id)
          setPagina('agenda')
        }}>+ Agendar novo contato</button>
      </section>

      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px'}}>
        <input aria-label="Buscar na lista de empresas" placeholder="🔎 Buscar cliente, telefone, cidade ou observações..." value={buscaEmpresa} onChange={e => setBuscaEmpresa(e.target.value)} style={{flex:'2 1 320px',minWidth:0}} />
        <select aria-label="Filtrar clientes por situação" value={filtroStatusEmpresa} onChange={e => setFiltroStatusEmpresa(e.target.value)} style={{flex:'1 1 220px',minWidth:0}}>
          <option value="">Todas as situações</option>
          <option value="Não atendeu, ligar novamente">Não atendeu / ligar novamente</option>
          {[...new Set(empresas.map(e => e.status).filter(Boolean))].filter(status => status !== 'Não atendeu, ligar novamente').sort((a,b)=>a.localeCompare(b,'pt-BR')).map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        {(buscaEmpresa || filtroStatusEmpresa) && <button type="button" onClick={()=>{setBuscaEmpresa('');setFiltroStatusEmpresa('')}}>Limpar filtros</button>}
      </div>
      <section className="panel table-wrap">
        {leadsSelecionados.length > 0 && (
          <div className="selection-toolbar">
            <strong>{leadsSelecionados.length} selecionado(s)</strong>
            <button type="button" className="btn-excluir" onClick={excluirSelecionados}>Excluir selecionados</button>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th className="select-col"><input type="checkbox" aria-label="Selecionar todos" checked={empresas.length > 0 && leadsSelecionados.length === empresas.length} onChange={(e)=>setLeadsSelecionados(e.target.checked ? empresas.map((item)=>item.id) : [])} /></th>
              <th>Empresa</th>
              <th>Segmento</th>
              <th>Cidade</th>
              <th>Telefone</th>
              <th>Status</th><th>Data do cadastro</th><th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {empresas.length > 0 ? (
              empresas.filter(empresa => (!filtroStatusEmpresa || empresa.status === filtroStatusEmpresa) && normalizarBusca([empresa.nome, empresa.nome_fantasia, empresa.telefone, empresa.whatsapp, empresa.cidade, empresa.segmento, empresa.status, empresa.pessoa_contato, empresa.observacoes].join(' ')).includes(normalizarBusca(buscaEmpresa))).map((empresa) => (
                <tr key={empresa.id}>
                  <td className="select-col"><input type="checkbox" aria-label={'Selecionar ' + (empresa.nome_fantasia || empresa.nome)} checked={leadsSelecionados.includes(empresa.id)} onChange={(e)=>setLeadsSelecionados((atuais)=>e.target.checked ? [...atuais, empresa.id] : atuais.filter((id)=>id !== empresa.id))} /></td>
                  <td>{empresa.nome}</td>
                  <td>{empresa.segmento || '-'}</td>
                  <td>
                    {empresa.cidade || '-'}
                    {empresa.estado ? ` / ${empresa.estado}` : ''}
                  </td>
                  <td>{empresa.telefone || empresa.whatsapp || '-'}</td>
                 <td>{empresa.status || '-'}</td>
<td>{dataBR(empresa.criado_em)}</td>
<td>
 
  <button
    type="button"
    onClick={() => editarEmpresa(empresa)}
    className="btn-editar"
  >
    Editar
  </button>

  <button
    type="button"
    onClick={() => excluirEmpresa(empresa.id)}
    className="btn-excluir"
  >
    Excluir
  </button>
</td>
                </tr>
              ))
            ) : (
              <tr>
<td colSpan="8" style={{ textAlign: 'center' }}>                 
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}

function Decisores() {
  const [contatos, setContatos] = useState([])
const [empresas, setEmpresas] = useState([])
const [mostrarFormDecisor, setMostrarFormDecisor] = useState(false)
const [salvandoDecisor, setSalvandoDecisor] = useState(false)
const [mensagemDecisor, setMensagemDecisor] = useState('')
    const [decisorEditandoId, setDecisorEditandoId] = useState(null)

const [formDecisor, setFormDecisor] = useState({
  empresa_id: '',
  nome: '',
  cargo: '',
  telefone: '',
  whatsapp: '',
  email: ''
})

    async function carregarDecisores() {
    const { data, error } = await supabase
      .from('contatos')
      .select(`
        *,
        empresas (
          nome
        )
      `)
      .order('nome')

    if (error) {
      console.error('Erro ao carregar decisores:', error)
      return
    }

    setContatos(data || [])
  }

  async function carregarEmpresasDecisor() {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome')
      .order('nome')

    if (error) {
      console.error('Erro ao carregar empresas:', error)
      return
    }

    setEmpresas(data || [])
  }

  useEffect(() => {
    carregarDecisores()
    carregarEmpresasDecisor()
  }, [])
    async function salvarDecisor(e) {
    e.preventDefault()
    setSalvandoDecisor(true)
    setMensagemDecisor('')

    if (!formDecisor.empresa_id || !formDecisor.nome) {
      setMensagemDecisor('Selecione a empresa e informe o nome do decisor.')
      setSalvandoDecisor(false)
      return
    }

    const dadosDecisor = {
      empresa_id: formDecisor.empresa_id,
      nome: formDecisor.nome,
      cargo: formDecisor.cargo || null,
      telefone: formDecisor.telefone || null,
      whatsapp: formDecisor.whatsapp || null,
      email: formDecisor.email || null,
      principal: true
    }
    const consultaDecisor = decisorEditandoId
      ? supabase.from('contatos').update(dadosDecisor).eq('id', decisorEditandoId)
      : supabase.from('contatos').insert([dadosDecisor])
    const { error } = await consultaDecisor

    if (error) {
      console.error('Erro ao salvar decisor:', error)
alert('Erro ao salvar decisor: ' + error.message)
  setSalvandoDecisor(false)
      return
    }

    setFormDecisor({
      empresa_id: '',
      nome: '',
      cargo: '',
      telefone: '',
      whatsapp: '',
      email: ''
    })

    setMensagemDecisor(decisorEditandoId ? 'Decisor atualizado com sucesso!' : 'Decisor cadastrado com sucesso!')
    setDecisorEditandoId(null)
    setMostrarFormDecisor(false)
    setSalvandoDecisor(false)
    await carregarDecisores()
  }

  function editarDecisor(contato) {
    setFormDecisor({
      empresa_id: contato.empresa_id || '',
      nome: contato.nome || '',
      cargo: contato.cargo || '',
      telefone: contato.telefone || '',
      whatsapp: contato.whatsapp || '',
      email: contato.email || ''
    })
    setDecisorEditandoId(contato.id)
    setMostrarFormDecisor(true)
  }

  async function excluirDecisor(id) {
  const confirmar = window.confirm('Tem certeza que deseja excluir este decisor?')

  if (!confirmar) return

  const { error } = await supabase
    .from('contatos')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir decisor: ' + error.message)
    return
  }

  await carregarDecisores()
}
  
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Decisores</h1>
            <p>Contatos responsáveis pelas decisões comerciais.</p>
          </div>
          <button
  className="btn-primary"
  onClick={() => { setDecisorEditandoId(null); setFormDecisor({ empresa_id:'', nome:'', cargo:'', telefone:'', whatsapp:'', email:'' }); setMostrarFormDecisor(true) }}
>
  + Novo Decisor
</button>
        </div>

        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Cargo</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>WhatsApp</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contatos.map((contato) => (
                <tr key={contato.id}>
                  <td><b>{contato.nome}</b></td>
                  <td>{nomeEmpresa(contato.empresa_id)}</td>
                  <td>{contato.cargo || '—'}</td>
                  <td>{contato.telefone || '—'}</td>
                  <td>{contato.email || '—'}</td>
                  <td>
                    {contato.whatsapp ? (
                      <a
                        className="whatsapp"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://wa.me/55${String(
                          contato.whatsapp
                        ).replace(/\D/g, '')}`}
                      >
                        Abrir WhatsApp
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                
        <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarDecisor(contato)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirDecisor(contato.id)}>Excluir</button></div></td>
  </tr>           
      ))}
              {!contatos.length && (
                <tr>
                  <td colSpan="7" className="empty">
                    Nenhum decisor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        {mostrarFormDecisor && (
  <section className="panel">
    <h2>{decisorEditandoId ? 'Editar Decisor' : 'Novo Decisor'}</h2>

<form onSubmit={salvarDecisor}>
  <label>Empresa</label>
      <select
        value={formDecisor.empresa_id}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, empresa_id: e.target.value })
        }
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome}
          </option>
        ))}
      </select>

      <label>Nome</label>
      <input
        type="text"
        value={formDecisor.nome}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, nome: e.target.value })
        }
      />

      <label>Cargo</label>
      <input
        type="text"
        value={formDecisor.cargo}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, cargo: e.target.value })
        }
      />

      <label>Telefone</label>
      <input
        type="text"
        value={formDecisor.telefone}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, telefone: e.target.value })
        }
      />

      <label>WhatsApp</label>
      <input
        type="text"
        value={formDecisor.whatsapp}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, whatsapp: e.target.value })
        }
      />

      <label>E-mail</label>
      <input
        type="email"
        value={formDecisor.email}
        onChange={(e) =>
          setFormDecisor({ ...formDecisor, email: e.target.value })
        }
      />

     <button type="submit" className="btn-primary" disabled={salvandoDecisor}>
{salvandoDecisor ? 'Salvando...' : 'Salvar Decisor'}
     </button>

      <button
        type="button"
        onClick={() => setMostrarFormDecisor(false)}
      >
        Cancelar
      </button>
    </form>
  </section>
)}
      </>
    )
  }

  async function excluirOportunidade(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta oportunidade?')) return
    const { error } = await supabase.from('oportunidades').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir oportunidade: ' + error.message)
      return
    }
    await carregarDados()
  }

  function Funil() {
    const [agendamentosFunil, setAgendamentosFunil] = useState({})

    async function agendarEEnviarWhatsApp(item) {
      const dataHora = agendamentosFunil[item.id]
      if (!dataHora) {
        alert('Selecione a data e a hora do agendamento.')
        return
      }

      const empresaNome = nomeEmpresa(item.empresa_id)
      const dataFormatada = new Date(dataHora).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })

      const { error } = await supabase.from('tarefas').insert([{
        empresa_id: item.empresa_id || null,
        titulo: 'Agendamento - ' + (item.titulo || empresaNome),
        descricao: 'Agendamento criado pelo Funil Comercial. Etapa: ' + item.etapa,
        data_hora: dataHora,
        prioridade: 'Normal',
        status: 'Pendente'
      }])

      if (error) {
        alert('Erro ao salvar o agendamento: ' + error.message)
        return
      }

      await carregarDados()

      const mensagem = [
        '📅 *AGENDAMENTO CENTRAL TRUCK*',
        '',
        'Empresa: ' + empresaNome,
        'Oportunidade: ' + (item.titulo || '-'),
        'Etapa: ' + item.etapa,
        'Data e hora: ' + dataFormatada
      ].join('\n')

      window.open('https://wa.me/5531975255079?text=' + encodeURIComponent(mensagem), '_blank', 'noopener,noreferrer')
    }

    const etapas = [
      'Lead Novo',
      'Primeiro Contato',
      'Interessado',
      'Visita Agendada',
      'Orçamento Enviado',
      'Em Negociação',
      'Venda Realizada',
      'Venda Perdida',
      'Pós-venda',
    ]


    async function moverOportunidade(id, novaEtapa) {
  const { error } = await supabase
    .from('oportunidades')
    .update({ etapa: novaEtapa })
    .eq('id', id)

  if (error) {
    alert('Erro ao alterar etapa: ' + error.message)
    return
  }

  await carregarDados()
}
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Funil Comercial</h1>
            <p>Acompanhamento das oportunidades por etapa.</p>
          </div>
        </div>

        <div className="kanban">
          {etapas.map((etapa) => {
            const itens = oportunidades.filter((o) => o.etapa === etapa)

            return (
              <div className="kanban-column" key={etapa}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.outline = '2px solid #19df91' }}
                onDragLeave={(e) => { e.currentTarget.style.outline = '' }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.outline = ''
                  const id = e.dataTransfer.getData('text/plain')
                  const item = oportunidades.find(o => String(o.id) === id)
                  if (item && item.etapa !== etapa) moverOportunidade(item.id, etapa)
                }}>
                <div className="kanban-title">
                  <b>{etapa}</b>
                  <span>{itens.length}</span>
                </div>

                {itens.map((item) => (
                 <details className="deal" key={item.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(item.id)); e.dataTransfer.effectAllowed = "move" }} style={{padding:"10px 12px",minHeight:0,cursor:"grab"}}>
  <summary style={{cursor:"pointer",fontWeight:700,listStyle:"revert",overflowWrap:"anywhere"}}>{nomeEmpresa(item.empresa_id) || item.titulo}</summary>
  <div style={{display:"grid",gap:"8px",marginTop:"12px"}}>
  <b>{item.titulo || nomeEmpresa(item.empresa_id)}</b>
  <strong>{dinheiro(item.valor_estimado)}</strong>



  <label className="deal-schedule-label">
    Data e hora do agendamento
    <input
      className="deal-schedule-input"
      type="datetime-local"
      value={agendamentosFunil[item.id] || ''}
      onChange={(e) => setAgendamentosFunil({ ...agendamentosFunil, [item.id]: e.target.value })}
    />
  </label>
  <button type="button" className="btn-whatsapp" onClick={() => agendarEEnviarWhatsApp(item)}>
    Agendar e enviar no WhatsApp
  </button>
  <button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button>
</div>
</details>
                ))}

                {!itens.length && (
                  <div className="kanban-empty">Nenhuma oportunidade</div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  function Oportunidades() {
      const [mostrarFormOportunidade, setMostrarFormOportunidade] = useState(false)
  const [salvandoOportunidade, setSalvandoOportunidade] = useState(false)
  const [mensagemOportunidade, setMensagemOportunidade] = useState('')
  const [selecionadas, setSelecionadas] = useState([])
  const [excluindoLote, setExcluindoLote] = useState(false)
  async function excluirSelecionadas() {
    if (!selecionadas.length || excluindoLote) return
    if (!window.confirm('Excluir definitivamente ' + selecionadas.length + ' oportunidade(s) selecionada(s)? Os cadastros das empresas serão preservados.')) return
    setExcluindoLote(true)
    const {error} = await supabase.from('oportunidades').delete().in('id', selecionadas)
    setExcluindoLote(false)
    if (error) { alert('Não foi possível excluir: ' + error.message); return }
    setSelecionadas([])
    await carregarDados()
  }

  const [formOportunidade, setFormOportunidade] = useState({
    empresa_id: '',
    titulo: '',
    servico: '',
    etapa: 'Lead Novo',
    valor_estimado: '',
    probabilidade: 0,
    previsao_fechamento: '',
    observacoes: ''
  })

  async function salvarOportunidade(e) {
    e.preventDefault()

    if (!formOportunidade.empresa_id || !formOportunidade.titulo) {
      setMensagemOportunidade('Selecione a empresa e informe o título da oportunidade.')
      return
    }

    setSalvandoOportunidade(true)
    setMensagemOportunidade('')

    const { error } = await supabase
      .from('oportunidades')
      .insert([{
        empresa_id: formOportunidade.empresa_id,
        titulo: formOportunidade.titulo,
        servico: formOportunidade.servico || null,
        etapa: formOportunidade.etapa,
        valor_estimado: formOportunidade.valor_estimado
          ? Number(formOportunidade.valor_estimado)
          : null,
        probabilidade: Number(formOportunidade.probabilidade) || 0,
        previsao_fechamento: formOportunidade.previsao_fechamento || null,
        observacoes: formOportunidade.observacoes || null
      }])

    if (error) {
      alert('Erro ao salvar oportunidade: ' + error.message)
      setSalvandoOportunidade(false)
      return
    }

    setFormOportunidade({
      empresa_id: '',
      titulo: '',
      servico: '',
      etapa: 'Lead Novo',
      valor_estimado: '',
      probabilidade: 0,
      previsao_fechamento: '',
      observacoes: ''
    })

    setMensagemOportunidade('Oportunidade cadastrada com sucesso!')
    setMostrarFormOportunidade(false)
    setSalvandoOportunidade(false)

    await carregarDados()
  }
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Oportunidades</h1>
            <p>Negociações comerciais em andamento.</p>
          </div>
        </div>
<button
  type="button"
  className="btn-primary"
  onClick={() => setMostrarFormOportunidade(true)}
>
  + Nova Oportunidade
</button>
<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginTop:12,marginBottom:12}}>
  <button type="button" onClick={()=>setSelecionadas(oportunidades.map(o=>o.id))}>Selecionar todas</button>
  <button type="button" onClick={()=>setSelecionadas([])}>Limpar seleção</button>
  <button type="button" className="btn-excluir" disabled={!selecionadas.length || excluindoLote} onClick={excluirSelecionadas}>
    {excluindoLote ? 'Excluindo...' : 'Excluir selecionadas ('+selecionadas.length+')'}
  </button>
</div>

{mensagemOportunidade && (
  <p>{mensagemOportunidade}</p>
)}
        {mostrarFormOportunidade && (
  <section className="panel">
    <h2>Nova Oportunidade</h2>

    <form onSubmit={salvarOportunidade}>

      <label>Empresa</label>
      <select
        value={formOportunidade.empresa_id}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            empresa_id: e.target.value
          })
        }
        required
      >
        <option value="">Selecione a empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome_fantasia || empresa.nome}
          </option>
        ))}
      </select>

      <label>Título da oportunidade</label>
      <input
        type="text"
        value={formOportunidade.titulo}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            titulo: e.target.value
          })
        }
        placeholder="Ex.: Manutenção sistema ARLA"
        required
      />

      <label>Serviço</label>
      <select
        value={formOportunidade.servico}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            servico: e.target.value
          })
        }
      >
        <option value="">Selecione</option>
        <option value="Catalisador">Catalisador</option>
        <option value="ARLA 32">ARLA 32</option>
        <option value="Diálise">Diálise</option>
        <option value="Diagnóstico">Diagnóstico</option>
        <option value="Sistema SCR">Sistema SCR</option>
        <option value="DPF">DPF</option>
        <option value="Injeção Diesel">Injeção Diesel</option>
        <option value="Elétrica">Elétrica</option>
        <option value="Mecânica Diesel">Mecânica Diesel</option>
      </select>

      <label>Etapa</label>
      <select
        value={formOportunidade.etapa}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            etapa: e.target.value
          })
        }
      >
        <option value="Lead Novo">Lead Novo</option>
        <option value="Primeiro Contato">Primeiro Contato</option>
        <option value="Interessado">Interessado</option>
        <option value="Visita Agendada">Visita Agendada</option>
        <option value="Orçamento Enviado">Orçamento Enviado</option>
        <option value="Em Negociação">Em Negociação</option>
        <option value="Venda Realizada">Venda Realizada</option>
        <option value="Venda Perdida">Venda Perdida</option>
        <option value="Pós-venda">Pós-venda</option>
                  <option value="Já é cliente">Já é cliente</option>
      </select>

      <label>Valor estimado (R$)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={formOportunidade.valor_estimado}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            valor_estimado: e.target.value
          })
        }
      />

      <label>Probabilidade (%)</label>
      <input
        type="number"
        min="0"
        max="100"
        value={formOportunidade.probabilidade}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            probabilidade: e.target.value
          })
        }
      />

      <label>Previsão de fechamento</label>
      <input
        type="date"
        value={formOportunidade.previsao_fechamento}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            previsao_fechamento: e.target.value
          })
        }
      />

      <label>Observações</label>
      <textarea
        value={formOportunidade.observacoes}
        onChange={(e) =>
          setFormOportunidade({
            ...formOportunidade,
            observacoes: e.target.value
          })
        }
      />

      <div>
        <button
          type="submit"
          className="btn-primary"
          disabled={salvandoOportunidade}
        >
          {salvandoOportunidade ? 'Salvando...' : 'Salvar Oportunidade'}
        </button>

        <button
          type="button"
          onClick={() => setMostrarFormOportunidade(false)}
        >
          Cancelar
        </button>
      </div>

    </form>
  </section>
)}
        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Selecionar todas as oportunidades" checked={oportunidades.length>0 && oportunidades.every(o=>selecionadas.includes(o.id))} onChange={e=>setSelecionadas(e.target.checked?oportunidades.map(o=>o.id):[])} /></th>
                <th>Oportunidade</th>
                <th>Empresa</th>
                <th>Serviço</th>
                <th>Etapa</th>
                <th>Valor</th>
                <th>Probabilidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" aria-label={'Selecionar '+(item.titulo||'oportunidade')} checked={selecionadas.includes(item.id)} onChange={e=>setSelecionadas(v=>e.target.checked?[...v,item.id]:v.filter(id=>id!==item.id))}/></td>
                  <td><b>{item.titulo || 'Oportunidade'}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.servico || '—'}</td>
                  <td><span className="status">{item.etapa}</span></td>
                  <td>{dinheiro(item.valor_estimado)}</td>
                  <td>{item.probabilidade || 0}%</td>
                  <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarOportunidade(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirOportunidade(item.id)}>Excluir</button></div></td>
                </tr>
              ))}

              {!oportunidades.length && (
                <tr>
                  <td colSpan="8" className="empty">
                    Nenhuma oportunidade cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </>
    )
  }
function Atendimentos() {
  const [mostrarFormAtendimento, setMostrarFormAtendimento] = useState(false)
const [salvandoAtendimento, setSalvandoAtendimento] = useState(false)
const [mensagemAtendimento, setMensagemAtendimento] = useState('')
const [atendimentoEditandoId, setAtendimentoEditandoId] = useState(null)

const [formAtendimento, setFormAtendimento] = useState({
  empresa_id: '',
  tipo: 'Ligação',
  descricao: '',
  data_atividade: new Date().toISOString().slice(0, 10),
  proximo_retorno: '',
  concluido: false
})

function editarAtendimento(item) {
  setFormAtendimento({
    empresa_id: item.empresa_id || '',
    tipo: item.tipo || 'Ligação',
    descricao: item.descricao || '',
    data_atividade: item.data_atividade ? String(item.data_atividade).slice(0,10) : new Date().toISOString().slice(0,10),
    proximo_retorno: item.proximo_retorno ? String(item.proximo_retorno).slice(0,10) : '',
    concluido: !!item.concluido
  })
  setAtendimentoEditandoId(item.id)
  setMostrarFormAtendimento(true)
}

async function excluirAtendimento(id) {
  const confirmar = window.confirm(
    'Tem certeza que deseja excluir este atendimento?'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('atividades')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Erro ao excluir atendimento: ' + error.message)
    return
  }

  await carregarDados()
} 
  async function salvarAtendimento(e) {
  e.preventDefault()

  if (!formAtendimento.empresa_id || !formAtendimento.descricao) {
    alert('Selecione a empresa e informe a descrição do atendimento.')
    return
  }

  setSalvandoAtendimento(true)

  const dadosAtendimento = {
    empresa_id: Number(formAtendimento.empresa_id),
    tipo: formAtendimento.tipo,
    descricao: formAtendimento.descricao,
    data_atividade: formAtendimento.data_atividade,
    proximo_retorno: formAtendimento.proximo_retorno || null,
    concluido: formAtendimento.concluido
  }
  const consultaAtendimento = atendimentoEditandoId
    ? supabase.from('atividades').update(dadosAtendimento).eq('id', atendimentoEditandoId)
    : supabase.from('atividades').insert([dadosAtendimento])
  const { error } = await consultaAtendimento

  if (error) {
    alert('Erro ao salvar atendimento: ' + error.message)
    setSalvandoAtendimento(false)
    return
  }

  setMensagemAtendimento(atendimentoEditandoId ? 'Atendimento atualizado com sucesso!' : 'Atendimento registrado com sucesso!')
  setAtendimentoEditandoId(null)
  setMostrarFormAtendimento(false)
  setSalvandoAtendimento(false)

  setFormAtendimento({
    empresa_id: '',
    tipo: 'Ligação',
    descricao: '',
    data_atividade: new Date().toISOString().slice(0, 10),
    proximo_retorno: '',
    concluido: false
  })

  await carregarDados()
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Atendimentos</h1>
          <p>Histórico de contatos e atividades comerciais.</p>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={() => { setAtendimentoEditandoId(null); setFormAtendimento({ empresa_id:'', tipo:'Ligação', descricao:'', data_atividade:new Date().toISOString().slice(0,10), proximo_retorno:'', concluido:false }); setMostrarFormAtendimento(true) }}
      >
        + Novo Atendimento
      </button>

      {mensagemAtendimento && (
        <p>{mensagemAtendimento}</p>
      )}

      {mostrarFormAtendimento && (
        <section className="panel">
          <form onSubmit={salvarAtendimento}>

            <label>Empresa</label>
            <select
              value={formAtendimento.empresa_id}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  empresa_id: e.target.value
                })
              }
              required
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>

            <label>Tipo de atendimento</label>
            <select
              value={formAtendimento.tipo}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  tipo: e.target.value
                })
              }
            >
              <option value="Ligação">Ligação</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Visita">Visita</option>
              <option value="E-mail">E-mail</option>
              <option value="Reunião">Reunião</option>
              <option value="Orçamento">Orçamento</option>
              <option value="Observação">Observação</option>
            </select>

            <label>Descrição</label>
            <textarea
              value={formAtendimento.descricao}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  descricao: e.target.value
                })
              }
              placeholder="Descreva o atendimento realizado..."
              required
            />

            <label>Data do atendimento</label>
            <input
              type="date"
              value={formAtendimento.data_atividade}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  data_atividade: e.target.value
                })
              }
            />

            <label>Próximo retorno</label>
            <input
              type="date"
              value={formAtendimento.proximo_retorno}
              onChange={(e) =>
                setFormAtendimento({
                  ...formAtendimento,
                  proximo_retorno: e.target.value
                })
              }
            />

            <label>
              <input
                type="checkbox"
                checked={formAtendimento.concluido}
                onChange={(e) =>
                  setFormAtendimento({
                    ...formAtendimento,
                    concluido: e.target.checked
                  })
                }
              />
              Atendimento concluído
            </label>

            <div>
              <button
                type="submit"
                className="btn-primary"
                disabled={salvandoAtendimento}
              >
                {salvandoAtendimento ? 'Salvando...' : 'Salvar Atendimento'}
              </button>

              <button
                type="button"
                onClick={() => setMostrarFormAtendimento(false)}
              >
                Cancelar
              </button>
            </div>

          </form>
        </section>
      )}

      <section className="panel">
        {atividades.map((item) => (
          <div className="activity" key={item.id}>
            <div className="activity-icon"></div>

            <div>
              <b>{item.tipo || 'Atendimento'}</b>
              <span>{nomeEmpresa(item.empresa_id)}</span>
              <p>{item.descricao || 'Sem descrição.'}</p>

              {item.proximo_retorno && (
                <p>
                  Próximo retorno: {dataBR(item.proximo_retorno)}
                </p>
              )}
            </div>

            <small>{dataBR(item.data_atividade)}</small>
            <div className="actions">{linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade) && <a className="btn-whatsapp" href={linkLembreteWhatsApp(item.empresa_id, item.tipo, item.descricao, item.proximo_retorno || item.data_atividade)} target="_blank" rel="noreferrer">WhatsApp</a>}<button type="button" className="btn-editar" onClick={() => editarAtendimento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={() => excluirAtendimento(item.id)}>Excluir</button></div>
          </div>
        ))}

        {!atividades.length && (
          <div className="empty">
            Nenhum atendimento registrado. Os botões Editar e Excluir aparecerão em cada atendimento cadastrado.
          </div>
        )}
      </section>
    </>
  )
}
  function Agenda() {
    const [mostrarFormTarefa, setMostrarFormTarefa] = useState(() => !!sessionStorage.getItem('centraltruck_agendar_empresa') || !!localStorage.getItem('ct_rascunho_agenda'))
    const [salvandoTarefa, setSalvandoTarefa] = useState(false)
    const [mensagemTarefa, setMensagemTarefa] = useState('')
    const [lembrarNoCRM, setLembrarNoCRM] = useState(true)
    const [antecedencia, setAntecedencia] = useState('0')
    const [avisosAgenda, setAvisosAgenda] = useState([])
    const numeroLembrete = '31975255079'
    useEffect(() => {
      const verificar = () => {
        const agora = Date.now()
        const avisos = tarefas.filter(t => {
          if (t.status === 'Concluída' || !t.data_hora || localStorage.getItem('ct_lembrete_' + t.id) === 'nao') return false
          const prazo = new Date(t.data_hora).getTime() - Number(localStorage.getItem('ct_antecedencia_' + t.id) || 0) * 60000
          return prazo <= agora && agora - prazo < 86400000
        })
        setAvisosAgenda(avisos)
        avisos.forEach(t => {
          const chave = 'ct_aviso_exibido_' + t.id + '_' + t.data_hora
          if (!sessionStorage.getItem(chave) && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Central Truck — Lembrete', {body: t.titulo + ' • ' + (nomeEmpresa(t.empresa_id) || 'Contato')})
            sessionStorage.setItem(chave, 'sim')
          }
        })
      }
      verificar()
      const intervalo = setInterval(verificar, 60000)
      return () => clearInterval(intervalo)
    }, [tarefas])
    const whatsappParaMim = tarefa => {
      const telefone = numeroLembrete.replace(/\D/g, '')
      const destino = telefone.startsWith('55') ? telefone : '55' + telefone
      const mensagem = 'LEMBRETE CENTRAL TRUCK%0A' + encodeURIComponent('Cliente: ' + nomeEmpresa(tarefa.empresa_id) + '\nTarefa: ' + tarefa.titulo + '\nData: ' + dataBR(tarefa.data_hora) + '\n' + (tarefa.descricao || ''))
      return 'https://wa.me/' + destino + '?text=' + mensagem
    }

    const [tarefaEditandoId, setTarefaEditandoId] = useState(null)
    const [formTarefa, setFormTarefa] = useState(() => {
       try { const salvo = JSON.parse(localStorage.getItem('ct_rascunho_agenda') || 'null'); if (salvo && typeof salvo === 'object') return salvo } catch (_) {}
       return { empresa_id: '', cliente_avulso: '', titulo: '', descricao: '', data_hora: '', prioridade: 'Normal', status: 'Pendente' }
     })
     useEffect(() => {
       if (mostrarFormTarefa) localStorage.setItem('ct_rascunho_agenda', JSON.stringify(formTarefa))
     }, [formTarefa, mostrarFormTarefa])

    useEffect(() => {
      const id = sessionStorage.getItem('centraltruck_agendar_empresa')
      if (id) {
        setFormTarefa(anterior => ({ ...anterior, empresa_id: id, titulo: 'Retornar contato', status: 'Pendente' }))
        setMostrarFormTarefa(true)
        sessionStorage.removeItem('centraltruck_agendar_empresa')
      }
    }, [])

    function editarTarefa(item) {
      setFormTarefa({
        empresa_id: item.empresa_id || '',
        cliente_avulso: (item.descricao || '').match(/^Cliente não cadastrado: (.*?)(?:\n|$)/)?.[1] || '',
        titulo: item.titulo || '',
        descricao: (item.descricao || '').replace(/^Cliente não cadastrado: .*?(?:\n|$)/, ''),
        data_hora: item.data_hora ? String(item.data_hora).slice(0,16) : '',
        prioridade: item.prioridade || 'Normal',
        status: item.status || 'Pendente'
      })
      setTarefaEditandoId(item.id)
      setLembrarNoCRM(localStorage.getItem('ct_lembrete_' + item.id) !== 'nao')
      setAntecedencia(localStorage.getItem('ct_antecedencia_' + item.id) || '0')
      setMostrarFormTarefa(true)
    }

    async function excluirTarefa(id) {
      const confirmar = window.confirm('Tem certeza que deseja excluir esta tarefa?')
      if (!confirmar) return

      const { error } = await supabase.from('tarefas').delete().eq('id', id)
      if (error) {
        alert('Erro ao excluir tarefa: ' + error.message)
        return
      }
      await carregarDados()
    }

    async function salvarTarefa(e) {
      e.preventDefault()

      if (!formTarefa.titulo.trim() || !formTarefa.data_hora) {
        alert('Informe o título e a data/hora da tarefa.')
        return
      }

      setSalvandoTarefa(true)
      setMensagemTarefa('')

      const dadosTarefa = {
        empresa_id: formTarefa.empresa_id ? Number(formTarefa.empresa_id) : null,
        titulo: formTarefa.titulo.trim(),
        descricao: [!formTarefa.empresa_id && formTarefa.cliente_avulso.trim() ? 'Cliente não cadastrado: ' + formTarefa.cliente_avulso.trim() : '', formTarefa.descricao.trim()].filter(Boolean).join('\n') || null,
        data_hora: formTarefa.data_hora,
        prioridade: formTarefa.prioridade,
        status: formTarefa.status,
      }
      const consultaTarefa = tarefaEditandoId
        ? supabase.from('tarefas').update(dadosTarefa).eq('id', tarefaEditandoId)
        : supabase.from('tarefas').insert([dadosTarefa])
      const { error } = await consultaTarefa

      if (error) {
        alert('Erro ao salvar tarefa: ' + error.message)
        setSalvandoTarefa(false)
        return
      }

      const idSalvo = tarefaEditandoId
      if (idSalvo) { localStorage.setItem('ct_lembrete_' + idSalvo, lembrarNoCRM ? 'sim' : 'nao'); localStorage.setItem('ct_antecedencia_' + idSalvo, antecedencia) }
      localStorage.removeItem('ct_rascunho_agenda')
       setMensagemTarefa(tarefaEditandoId ? 'Tarefa atualizada com sucesso!' : 'Tarefa cadastrada com sucesso!')
      setTarefaEditandoId(null)
      setMostrarFormTarefa(false)
      setSalvandoTarefa(false)
      setFormTarefa({
        empresa_id: '',
        titulo: '',
        descricao: '',
        data_hora: '',
        prioridade: 'Normal',
        status: 'Pendente',
      })
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Agenda</h1>
            <p>Retornos, ligações, visitas e tarefas comerciais. {tarefas.length} tarefa(s) sincronizada(s) com o Dashboard.</p>
          </div>
        </div>

        <button type="button" className="btn-secondary" onClick={carregarDados} style={{marginRight:12}}>↻ Atualizar agendamentos</button>
        {erro && <p role="alert">Erro ao carregar agenda: {erro}</p>}
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setTarefaEditandoId(null); setFormTarefa({ empresa_id:'', cliente_avulso:'', titulo:'', descricao:'', data_hora:'', prioridade:'Normal', status:'Pendente' }); setMostrarFormTarefa(true) }}
        >
          + Nova Tarefa
        </button>

        {mostrarFormTarefa && (
          <section className="panel form-panel">
            <form onSubmit={salvarTarefa}>
              <div className="form-grid">
                <label>
                  Empresa
                  <select
                    value={formTarefa.empresa_id}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, empresa_id: e.target.value })
                    }
                  >
                    <option value="">Sem empresa vinculada</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome_fantasia || empresa.nome}
                      </option>
                    ))}
                  </select>
                </label>

                {!formTarefa.empresa_id && (
                  <label>
                    Nome do cliente não cadastrado
                    <input
                      type="text"
                      value={formTarefa.cliente_avulso || ''}
                      onChange={(e) => setFormTarefa({ ...formTarefa, cliente_avulso: e.target.value })}
                      placeholder="Digite o nome do cliente ou empresa"
                    />
                  </label>
                )}

                <label>
                  Título
                  <input
                    type="text"
                    value={formTarefa.titulo}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, titulo: e.target.value })
                    }
                    placeholder="Ex.: Retornar para cliente"
                    required
                  />
                </label>

                <label>
                  Data e hora
                  <input
                    type="datetime-local"
                    value={formTarefa.data_hora}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, data_hora: e.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Prioridade
                  <select
                    value={formTarefa.prioridade}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, prioridade: e.target.value })
                    }
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={formTarefa.status}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, status: e.target.value })
                    }
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </label>

                <label className="full">
                  Descrição
                  <textarea
                    value={formTarefa.descricao}
                    onChange={(e) =>
                      setFormTarefa({ ...formTarefa, descricao: e.target.value })
                    }
                    placeholder="Observações sobre a tarefa..."
                  />
                </label>
              </div>

              <div style={{margin:'12px 0',display:'flex',gap:'14px',flexWrap:'wrap',alignItems:'center'}}><label><input type="checkbox" checked={lembrarNoCRM} onChange={e=>setLembrarNoCRM(e.target.checked)} /> Lembrar no CRM</label><label>Antecedência <select value={antecedencia} onChange={e=>setAntecedencia(e.target.value)}><option value="0">Na hora</option><option value="15">15 minutos</option><option value="60">1 hora</option><option value="1440">1 dia</option></select></label><button type="button" onClick={() => { if ('Notification' in window) Notification.requestPermission(); else alert('Seu navegador não suporta notificações.'); }}>Ativar notificações do navegador</button></div><p style={{fontSize:'12px'}}>Avisos automáticos funcionam enquanto o CRM estiver aberto. O envio pelo WhatsApp exige clicar em enviar.</p>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={salvandoTarefa}>
                  {salvandoTarefa ? 'Salvando...' : 'Salvar Tarefa'}
                </button>
                <button type="button" onClick={() => setMostrarFormTarefa(false)}>
                  Cancelar
                </button>
              </div>

              {mensagemTarefa && <p>{mensagemTarefa}</p>}
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-heading"><div><h2>Agendamentos cadastrados ({tarefas.length})</h2><p>Todos os contatos salvos na Agenda.</p></div></div>
          {tarefas.map((tarefa) => (
            <div className="activity" key={tarefa.id}>
              <div className="activity-icon">✓</div>
              <div>
                <b>{tarefa.titulo}</b>
                <span>{nomeEmpresa(tarefa.empresa_id)}</span>
                <p>{tarefa.descricao || 'Sem descrição.'}</p>
              </div>
              <div className="task-date">
                <b>{dataBR(tarefa.data_hora)}</b>
                <span>{tarefa.status}</span>
                <div className="actions">
                  <a className="btn-whatsapp" href={whatsappParaMim(tarefa)} target="_blank" rel="noreferrer">🔔 Lembrete no meu WhatsApp</a>
                  <button type="button" className="btn-editar" onClick={() => editarTarefa(tarefa)}>Editar</button>
                  <button type="button" className="btn-excluir" onClick={() => excluirTarefa(tarefa.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
          {!tarefas.length && (
            <div className="empty">Nenhuma tarefa cadastrada.</div>
          )}
        </section>
      </>
    )
  }

  function Orcamentos() {
    const chaveRascunho = 'centraltruck_orcamento_rascunho_' + (session?.user?.id || 'local')
    const [mostrarForm, setMostrarForm] = useState(() => {
      try { return Boolean(JSON.parse(localStorage.getItem(chaveRascunho))?.aberto) } catch { return false }
    })
    const [salvando, setSalvando] = useState(false)
    const [filtroMes, setFiltroMes] = useState('')
    const [filtroInicio, setFiltroInicio] = useState('')
    const [filtroFim, setFiltroFim] = useState('')
    const orcamentosFiltrados = orcamentos.filter(item => {
      if (!item.data_envio) return !filtroMes && !filtroInicio && !filtroFim
      const data = String(item.data_envio).slice(0,10)
      if (filtroMes && data.slice(0,7) !== filtroMes) return false
      if (filtroInicio && data < filtroInicio) return false
      if (filtroFim && data > filtroFim) return false
      return true
    })
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(() => {
      try { return JSON.parse(localStorage.getItem(chaveRascunho))?.editandoId ?? null } catch { return null }
    })
    const [osAberta, setOsAberta] = useState(null)
    const [osArquivos, setOsArquivos] = useState([])
    const [osErro, setOsErro] = useState('')
    const [osEnviando, setOsEnviando] = useState(false)
    async function carregarOS(item) {
      setOsAberta(item)
      setOsErro('')
      const {data,error} = await supabase.storage.from('orcamento-anexos').list(String(item.id))
      if(error){setOsErro('Armazenamento indisponível: '+error.message);setOsArquivos([]);return}
      setOsArquivos((data||[]).filter(x=>x.name!=='.emptyFolderPlaceholder'))
    }
    async function anexarOS(e) {
      const arquivo=e.target.files?.[0]
      e.target.value=''
      if(!arquivo||!osAberta)return
      if(arquivo.size>10485760){setOsErro('Limite de 10 MB por arquivo.');return}
      if(!/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(arquivo.name)){setOsErro('Selecione PDF, Word ou imagem.');return}
      setOsEnviando(true)
      setOsErro('')
      try {
        const nome=Date.now()+'-'+arquivo.name.replace(/[^a-zA-Z0-9._-]/g,'_')
        const {error}=await supabase.storage.from('orcamento-anexos').upload(String(osAberta.id)+'/'+nome,arquivo)
        if(error)throw error
        await carregarOS(osAberta)
      }catch(error){setOsErro('Erro ao salvar OS: '+error.message)}
      finally{setOsEnviando(false)}
    }
    async function visualizarOS(nome) {
      const {data,error}=await supabase.storage.from('orcamento-anexos').createSignedUrl(String(osAberta.id)+'/'+nome,120)
      if(error){setOsErro(error.message);return}
      window.open(data.signedUrl,'_blank','noopener,noreferrer')
    }
    const [form, setForm] = useState(() => {
      let anterior = null
      try { anterior = JSON.parse(localStorage.getItem(chaveRascunho))?.form } catch {}
      return anterior || {
      empresa_id: '',
      oportunidade_id: '',
      numero_orcamento: '',
      descricao: '',
      valor: '',
      status: 'Enviado',
      data_envio: new Date().toISOString().slice(0, 10),
      validade: '',
      observacoes: '',
      }
    })
    useEffect(() => {
      if (mostrarForm) localStorage.setItem(chaveRascunho, JSON.stringify({aberto:true,editandoId:orcamentoEditandoId,form}))
    }, [mostrarForm, orcamentoEditandoId, form, chaveRascunho])

    async function salvarOrcamento(e) {
      e.preventDefault()
      if (!form.empresa_id || !form.descricao) {
        alert('Selecione a empresa e informe a descrição.')
        return
      }
      setSalvando(true)
      const dadosOrcamento = {
        empresa_id: Number(form.empresa_id),
        oportunidade_id: form.oportunidade_id ? Number(form.oportunidade_id) : null,
        numero_orcamento: form.numero_orcamento.trim() || null,
        descricao: form.descricao.trim(),
        valor: form.valor ? Number(form.valor) : null,
        status: form.status,
        data_envio: form.data_envio || null,
        validade: form.validade || null,
        observacoes: form.observacoes.trim() || null,
      }
      const consultaOrcamento = orcamentoEditandoId
        ? supabase.from('orcamentos').update(dadosOrcamento).eq('id', orcamentoEditandoId)
        : supabase.from('orcamentos').insert([dadosOrcamento])
      const { error } = await consultaOrcamento
      if (error) {
        alert('Erro ao salvar orçamento: ' + error.message)
        setSalvando(false)
        return
      }
      setForm({
        empresa_id: '', oportunidade_id: '', numero_orcamento: '', descricao: '',
        valor: '', status: 'Enviado', data_envio: new Date().toISOString().slice(0, 10),
        validade: '', observacoes: '',
      })
      localStorage.removeItem(chaveRascunho)
      setOrcamentoEditandoId(null)
      setMostrarForm(false)
      setSalvando(false)
      await carregarDados()
    }

    function editarOrcamento(item) {
      setForm({
        empresa_id: item.empresa_id || '',
        oportunidade_id: item.oportunidade_id || '',
        numero_orcamento: item.numero_orcamento || '',
        descricao: item.descricao || '',
        valor: item.valor ?? '',
        status: item.status || 'Enviado',
        data_envio: item.data_envio ? String(item.data_envio).slice(0,10) : '',
        validade: item.validade ? String(item.validade).slice(0,10) : '',
        observacoes: item.observacoes || ''
      })
      setOrcamentoEditandoId(item.id)
      setMostrarForm(true)
    }

    async function excluirOrcamento(id) {
      if (!window.confirm('Excluir este orçamento?')) return
      const { error } = await supabase.from('orcamentos').delete().eq('id', id)
      if (error) return alert('Erro ao excluir orçamento: ' + error.message)
      await carregarDados()
    }

    return (
      <>
        <div className="page-title">
          <div>
            <h1>Orçamentos</h1>
            <p>Controle dos orçamentos enviados aos clientes.</p>
          </div>
          <button className="primary" onClick={() => {
            if (mostrarForm) { localStorage.removeItem(chaveRascunho); setMostrarForm(false); setOrcamentoEditandoId(null); return }
            setOrcamentoEditandoId(null)
            setForm({ empresa_id:'', oportunidade_id:'', numero_orcamento:'', descricao:'', valor:'', status:'Enviado', data_envio:new Date().toISOString().slice(0,10), validade:'', observacoes:'' })
            setMostrarForm(true)
          }}>
            {mostrarForm ? 'Cancelar' : '+ Novo Orçamento'}
          </button>
        </div>

        {mostrarForm && (
          <section className="panel">
            <h2>{orcamentoEditandoId ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
            <form onSubmit={salvarOrcamento}>
              <div className="form-grid">
                <label>Empresa *
                  <select value={form.empresa_id} onChange={(e) => setForm({...form, empresa_id:e.target.value})} required>
                    <option value="">Selecione</option>
                    {empresas.map((x)=><option key={x.id} value={x.id}>{x.nome_fantasia || x.nome}</option>)}
                  </select>
                </label>
                <label>Oportunidade
                  <select value={form.oportunidade_id} onChange={(e) => setForm({...form, oportunidade_id:e.target.value})}>
                    <option value="">Sem vínculo</option>
                    {oportunidades.filter((x)=>!form.empresa_id || String(x.empresa_id)===String(form.empresa_id)).map((x)=><option key={x.id} value={x.id}>{x.titulo}</option>)}
                  </select>
                </label>
                <label>Número
                  <input value={form.numero_orcamento} onChange={(e)=>setForm({...form,numero_orcamento:e.target.value})} placeholder="Ex.: ORC-001"/>
                </label>
                <label>Valor (R$)
                  <input type="number" min="0" step="0.01" value={form.valor} onChange={(e)=>setForm({...form,valor:e.target.value})}/>
                </label>
                <label>Status
                  <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                    {['Rascunho','Enviado','Visualizado','Em negociação','Aprovado','Recusado','Finalizado'].map((x)=><option key={x}>{x}</option>)}
                  </select>
                </label>
                <label>Data de envio
                  <input type="date" value={form.data_envio} onChange={(e)=>setForm({...form,data_envio:e.target.value})}/>
                </label>
                <label>Validade
                  <input type="date" value={form.validade} onChange={(e)=>setForm({...form,validade:e.target.value})}/>
                </label>
                <label className="full">Descrição *
                  <textarea value={form.descricao} onChange={(e)=>setForm({...form,descricao:e.target.value})} required/>
                </label>
                <label className="full">Observações
                  <textarea value={form.observacoes} onChange={(e)=>setForm({...form,observacoes:e.target.value})}/>
                </label>
              </div>
              <div className="form-actions">
                <button className="primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar Orçamento'}</button>
              </div>
            </form>
          </section>
        )}

        {osAberta && <section className="panel">
          <h2>Anexar OS — Orçamento {osAberta.numero_orcamento || osAberta.id}</h2>
          <p>Selecione PDF, Word ou imagem (máximo 10 MB).</p>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={osEnviando} onChange={anexarOS}/>
          {osEnviando && <p>Enviando...</p>}
          {osErro && <p role="alert" style={{color:'#ff8585'}}>{osErro}</p>}
          {osArquivos.map(a=><div key={a.name} style={{marginTop:10}}>
            <span>{a.name} </span>
            <button type="button" onClick={()=>visualizarOS(a.name)}>Abrir / baixar</button>
          </div>)}
          <button type="button" onClick={()=>setOsAberta(null)}>Fechar</button>
        </section>}
        <section className="panel" style={{marginBottom:16}}>
          <h2>Filtrar orçamentos por mês e data</h2>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}>
            <label>Mês <input type="month" value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}/></label>
            <label>Data inicial <input type="date" value={filtroInicio} onChange={e=>setFiltroInicio(e.target.value)}/></label>
            <label>Data final <input type="date" value={filtroFim} onChange={e=>setFiltroFim(e.target.value)}/></label>
            <button type="button" onClick={()=>{setFiltroMes('');setFiltroInicio('');setFiltroFim('')}}>Limpar filtros</button>
          </div>
          <p>{orcamentosFiltrados.length} orçamento(s) encontrado(s)</p>
        </section>
        <section className="panel table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Empresa</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Envio</th><th>Ações</th></tr></thead>
            <tbody>
              {orcamentosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.numero_orcamento || `#${item.id}`}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.descricao || '—'}</td>
                  <td>{dinheiro(item.valor)}</td>
                  <td><span className="status">{item.status}</span></td>
                  <td>{dataBR(item.data_envio)}</td>
                  <td><div className="actions"><button type="button" onClick={() => carregarOS(item)}>Anexar OS</button><button type="button" className="btn-editar" onClick={() => editarOrcamento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={()=>excluirOrcamento(item.id)}>Excluir</button></div></td>
                </tr>
              ))}
              {!orcamentos.length && <tr><td colSpan="7" className="empty">Nenhum orçamento cadastrado.</td></tr>}
            </tbody>
          </table>
        </section>
      </>
    )
  }

  function Relatorios() {
    const [arquivoLeads, setArquivoLeads] = useState(null)
    const [importandoLeads, setImportandoLeads] = useState(false)
    const [msgImportacao, setMsgImportacao] = useState('')

    async function baixarModeloLeads() {
      const XLSX = await import('xlsx')
      const dados = [
        ['CENTRAL TRUCK SERVICE'],
        ['LISTA DE LEADS - IMPORTACAO PARA O CRM'],
        [],
        ['Nome da empresa','Nome fantasia','CNPJ','Segmento','Classificacao','Status','Cidade','Estado','Telefone','WhatsApp','E-mail','Site','Observacoes'],
        ['Transportadora Exemplo','Exemplo Logistica','','Transportadora','A','Lead novo','Contagem','MG','31999999999','31999999999','contato@exemplo.com.br','','Cliente para prospeccao']
      ]
      const ws = XLSX.utils.aoa_to_sheet(dados)
      ws['!merges'] = [XLSX.utils.decode_range('A1:M1'), XLSX.utils.decode_range('A2:M2')]
      ws['!cols'] = [{wch:28},{wch:26},{wch:20},{wch:20},{wch:15},{wch:20},{wch:20},{wch:10},{wch:18},{wch:18},{wch:30},{wch:28},{wch:38}]
      ws['!rows'] = [{hpt:34},{hpt:25},{hpt:8},{hpt:28}]
      ws['!autofilter'] = { ref: 'A4:M5' }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Leads Central Truck')
      XLSX.writeFile(wb, 'Modelo_Leads_Central_Truck.xlsx')
    }

    function separarCSV(linha) {
      const valores = []
      let atual = ''
      let aspas = false
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i]
        if (ch === '"') {
          if (aspas && linha[i + 1] === '"') { atual += '"'; i++ } else aspas = !aspas
        } else if ((ch === ',' || ch === ';') && !aspas) {
          valores.push(atual.trim()); atual = ''
        } else atual += ch
      }
      valores.push(atual.trim())
      return valores
    }

    async function importarLeads() {
      if (!arquivoLeads) { setMsgImportacao('Selecione um arquivo para continuar.'); return }
      const extensao = (arquivoLeads.name.split('.').pop() || '').toLowerCase()
      if (extensao !== 'csv') {
        setMsgImportacao('Arquivo recebido sem alterar o original. PDF, JPG/PNG e Word podem ser enviados e mantidos no formato original; para cadastrar clientes automaticamente no Funil, use CSV.')
        return
      }
      setImportandoLeads(true)
      setMsgImportacao('')
      try {
        const texto = await arquivoLeads.text()
        const linhas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim())
        if (linhas.length < 2) throw new Error('O arquivo está vazio ou sem clientes.')
        const colunas = separarCSV(linhas[0]).map((x) => x.toLowerCase().trim())
        const obrigatoria = colunas.indexOf('nome')
        if (obrigatoria < 0) throw new Error('A coluna "nome" é obrigatória. Use o modelo disponível.')
        let importados = 0
        let falhas = 0
        for (const linha of linhas.slice(1)) {
          const valores = separarCSV(linha)
          const registro = {}
          colunas.forEach((col, idx) => { registro[col] = (valores[idx] || '').trim() })
          if (!registro.nome) { falhas++; continue }
          const status = registro.status || 'Lead novo'
          const empresa = {
            nome: registro.nome,
            nome_fantasia: registro.nome_fantasia || null,
            cnpj: registro.cnpj || null,
            segmento: registro.segmento || null,
            classificacao: ['A','B','C'].includes((registro.classificacao || '').toUpperCase()) ? registro.classificacao.toUpperCase() : 'B',
            status,
            cidade: registro.cidade || null,
            estado: registro.estado || 'MG',
            telefone: registro.telefone || null,
            whatsapp: registro.whatsapp || null,
            email: registro.email || null,
            site: registro.site || null,
            observacoes: registro.observacoes || null
          }
          const { data: criada, error: erroEmpresa } = await supabase.from('empresas').insert([empresa]).select('id').single()
          if (erroEmpresa || !criada?.id) { falhas++; continue }
          importados++
        }
        await carregarDados()
        setArquivoLeads(null)
        setMsgImportacao(importados + ' cliente(s) importado(s) para Empresas/Leads. Oportunidades só serão criadas quando cadastradas explicitamente.' + (falhas ? ' ' + falhas + ' linha(s) com erro.' : ''))
      } catch (e) {
        setMsgImportacao('Erro na importação: ' + e.message)
      } finally {
        setImportandoLeads(false)
      }
    }

    return (
      <>
        <div className="page-title"><div><h1>Relatórios</h1><p>Indicadores comerciais da Central Truck.</p></div></div>
        <section className="cards">
          <Card titulo="Leads" valor={empresas.length} />
          <Card titulo="Contatos" valor={contatos.length} />
          <Card titulo="Oportunidades" valor={oportunidades.length} />
          <Card titulo="Vendas" valor={vendas.length} />
          <Card titulo="Conversão" valor={`${conversao}%`} />
          <Card titulo="Valor Vendido" valor={dinheiro(valorVendido)} />
        </section>
        <section className="panel lead-import-panel">
          <div className="panel-heading">
            <div><h2>Enviar relatórios e importar clientes</h2><p>Selecione PDF, JPG, PNG, Word ou CSV. O arquivo original é mantido sem alteração; listas em CSV podem ser organizadas automaticamente em Empresas/Leads e no Funil Comercial.</p></div>
          </div>
          <div className="lead-import-actions">
            <button type="button" className="btn-secondary" onClick={baixarModeloLeads}>Baixar modelo Excel</button>
            <label className="file-import-box">
              <span>{arquivoLeads ? arquivoLeads.name : 'Selecionar lista de clientes (.CSV)'}</span>
              <input type="file" accept=".csv,text/csv" onChange={(e)=>{setArquivoLeads(e.target.files?.[0] || null);setMsgImportacao('')}} />
            </label>
            <button type="button" className="primary" disabled={importandoLeads || !arquivoLeads} onClick={importarLeads}>{importandoLeads ? 'Importando...' : 'Importar clientes para o Funil'}</button>
          </div>
          <p className="import-help"><b>Importação de clientes:</b> use CSV para cadastrar automaticamente Empresas/Leads e criar as oportunidades no Funil. Colunas aceitas: nome, nome_fantasia, CNPJ, segmento, classificação A/B/C, status, cidade, estado, telefone, WhatsApp, e-mail, site e observações.</p>
          <div className="import-message"><b>Relatórios PDF, JPG, PNG e Word:</b> são documentos para consulta e não são convertidos automaticamente em clientes, evitando perda de formatação ou cadastro incorreto. Para importar uma lista desses formatos, converta-a primeiro para CSV usando o modelo acima.</div>
          {msgImportacao && <div className="import-message">{msgImportacao}</div>}
        </section>
      </>
    )
  }


  function ImportarContatos() {
    const [arquivo, setArquivo] = useState(null)
    const [importando, setImportando] = useState(false)
    const [mensagem, setMensagem] = useState('')

    const normalizar = (v='') => String(v ?? '').trim()
    const chave = (v='') => normalizar(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')

    function valorCampo(registro, nomes) {
      for (const nome of nomes) {
        const k = Object.keys(registro).find(x => chave(x) === chave(nome))
        if (k && normalizar(registro[k])) return normalizar(registro[k])
      }
      return ''
    }

    async function lerArquivo(file) {
      const ext=(file.name.split('.').pop()||'').toLowerCase()
      if (['xlsx','xls','xlsm','xlsb','ods','csv','txt'].includes(ext)) {
        const XLSX=await import('xlsx')
        const buffer=await file.arrayBuffer()
        const wb=XLSX.read(buffer,{type:'array'})
        const aliases=['empresa','nome da empresa','razao social','nome fantasia','nome','cliente','oficina','estabelecimento','organizacao','company','organization','contato','nome do contato','telefone','celular','whatsapp','email','e-mail','endereco','cidade','cnpj','responsavel']
        const saida=[]
        for(const nomeAba of wb.SheetNames){
          const matriz=XLSX.utils.sheet_to_json(wb.Sheets[nomeAba],{header:1,defval:'',raw:false,blankrows:false})
          if(!matriz.length) continue
          const pontuacao=linha=>(Array.isArray(linha)?linha:[]).filter(c=>aliases.some(a=>chave(c)===chave(a)||chave(c).startsWith(chave(a))&&chave(a).length>4)).length
          const candidatos=matriz.slice(0,30).map((linha,i)=>({i,p:pontuacao(linha)})).sort((a,b)=>b.p-a.p)
          const indice=candidatos[0]?.p>=2?candidatos[0].i:-1
          if(indice<0) continue
          const titulos=matriz[indice].map((c,i)=>normalizar(c)||'Coluna '+(i+1))
          const registros=matriz.slice(indice+1).filter(linha=>Array.isArray(linha)&&linha.some(c=>normalizar(c))).map(linha=>Object.fromEntries(titulos.map((titulo,i)=>[titulo,linha[i]??''])))
          saida.push(...registros)
        }
        if(!saida.length) throw new Error('Não identifiquei automaticamente os campos desta planilha. Envie uma planilha com títulos como Nome, Empresa, Telefone ou E-mail.')
        return saida
      }
      if (['json'].includes(ext)) {
        const obj=JSON.parse(await file.text())
        return Array.isArray(obj)?obj:(obj.contatos||obj.clientes||obj.empresas||[])
      }
      if (['vcf','vcard'].includes(ext)) {
        const texto=await file.text()
        return texto.split(/BEGIN:VCARD/i).slice(1).map(bloco=>{
          const pega=(re)=>((bloco.match(re)||[])[1]||'').trim()
          return {nome:pega(/\nFN[^:]*:([^\r\n]+)/i),telefone:pega(/\nTEL[^:]*:([^\r\n]+)/i),email:pega(/\nEMAIL[^:]*:([^\r\n]+)/i),empresa:pega(/\nORG[^:]*:([^\r\n]+)/i)}
        })
      }
      throw new Error('Formato não compatível para importação automática.')
    }

    async function importar() {
      if(!arquivo){setMensagem('Selecione um arquivo.');return}
      setImportando(true); setMensagem('')
      try{
        const linhas=await lerArquivo(arquivo)
        if(!linhas.length) throw new Error('Nenhum contato encontrado no arquivo.')
        let ok=0, erros=0
        for(const r of linhas){
          const nomeEmpresa=valorCampo(r,['nome da empresa','empresa','razao social','razão social','nome fantasia','cliente','oficina','estabelecimento','organização','nome','company','organization','org','nome do contato','contato'])
          const contato=valorCampo(r,['pessoa de contato','contato','responsavel','responsável','nome do contato','nome decisor / contato','contact','contact name'])
          const camposTelefone = Object.keys(r).filter(k => /^(telefone|fone|tel|celular|whatsapp|whats|zap|phone|mobile|contatotelefonico|numero)/.test(chave(k)))
          const telefone=valorCampo(r,['telefone','telefone comercial','fone','phone','celular','mobile','telefone 1','telefone principal','telefone 2','telefone de contato','contato telefonico','fone/whatsapp','telefone/whatsapp','tel','numero de telefone']) || camposTelefone.map(k => normalizar(r[k])).find(Boolean) || ''
          const whatsapp=valorCampo(r,['whatsapp','telefone direto / whatsapp','telefone direto whatsapp','whats app','zap','celular whatsapp','telefone whatsapp']) || telefone
          const email=valorCampo(r,['email','e-mail','e-mail corporativo / público','email corporativo publico','mail','correio eletronico'])
          const cidade=valorCampo(r,['cidade','city'])
          const estado=valorCampo(r,['estado','uf','state']) || 'MG'
          const segmento=valorCampo(r,['segmento','categoria','ramo'])
          const status=valorCampo(r,['status','etapa']) || 'Lead novo'
          const cnpj=valorCampo(r,['cnpj','cpf/cnpj','documento'])
          const observacoes=[valorCampo(r,['observacoes','observações','obs','notes']),...['Cargo / área decisora','Frota / operação','Tecnologias / equipamentos','Prioridade','LinkedIn decisor','Funcionários estimados'].map(c=>valorCampo(r,[c])?c+': '+valorCampo(r,[c]):'')].filter(Boolean).join(' | ')
          if(!nomeEmpresa){erros++;continue}
          const dados={nome:nomeEmpresa,nome_fantasia:null,cnpj:cnpj||null,segmento:segmento||null,status,cidade:cidade||null,estado,telefone:telefone||null,whatsapp:whatsapp||null,email:email||null,observacoes:[contato?'Contato: '+contato:'',observacoes].filter(Boolean).join(' | ')||null}
          const {error}=await supabase.from('empresas').insert([dados])
          if(error) { erros++; console.error('Falha ao importar empresa:',nomeEmpresa,error); }
          else ok++
        }
        await carregarDados()
        if(ok>0) {
          setPagina('empresas')
          window.alert(ok+' empresa(s) salva(s) em Empresas / Leads.'+(erros?' '+erros+' registro(s) falharam; confira o console para detalhes.':''))
        } else {
          setMensagem('Nenhuma empresa foi salva. '+erros+' registro(s) falharam. Confira os nomes das empresas e as permissões de gravação no Supabase.')
        }
      }catch(e){setMensagem('Erro: '+e.message)}
      finally{setImportando(false)}
    }

    return <>
      <div className="page-title"><div><h1>Importar Contatos</h1><p>Importe listas de contatos e clientes diretamente para o CRM.</p></div></div>
      <section className="panel lead-import-panel">
        <h2>Selecionar arquivo</h2>
        <p>Compatível com planilhas Excel antigas e atuais, CSV, ODS, TXT, JSON e contatos VCF/vCard.</p>
        <div className="lead-import-actions">
          <label className="file-import-box">
            <span>{arquivo?arquivo.name:'Selecionar arquivo de contatos'}</span>
            <input type="file" accept=".xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.txt,.json,.vcf,.vcard" onChange={e=>{setArquivo(e.target.files?.[0]||null);setMensagem('')}} />
          </label>
          <button type="button" className="primary" disabled={!arquivo||importando} onClick={importar}>{importando?'Importando...':'Importar para o CRM'}</button>
        </div>
        <p className="import-help"><b>Campos reconhecidos automaticamente:</b> empresa, pessoa de contato, CNPJ, segmento, status, cidade, estado, telefone, WhatsApp, e-mail e observações. Os títulos podem variar, por exemplo: Empresa, Razão Social, Contato, Responsável, Fone, Celular, UF ou E-mail.</p>
        <div className="import-message"><b>PDF, JPG/PNG e Word:</b> podem ser mantidos em Relatórios, mas não são convertidos automaticamente em contatos para evitar cadastros incorretos.</div>
        {mensagem&&<div className="import-message">{mensagem}</div>}
      </section>
    </>
  }

  function Configuracoes() {
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Configurações</h1>
            <p>Informações gerais do CRM.</p>
          </div>
        </div>

        <section className="panel config">
          <h2>Central Truck Service</h2>
          <p><b>Sistema:</b> Central Truck CRM</p>
          <p><b>Banco de dados:</b> Supabase</p>
          <p><b>Hospedagem:</b> GitHub Pages</p>
          <p><b>Moeda:</b> Real brasileiro (BRL)</p>
          <p><b>Idioma:</b> Português do Brasil</p>

          <button className="primary" onClick={carregarDados}>
            Testar conexão com banco
          </button>
        </section>
      </>
    )
  }


  function OrdensServico() {
    const vazio = {numero_os:'',empresa_id:'',servicos:'',pecas:'',produto:'',valor_produto:'',valor:'',forma_pagamento:''}
    const [registros,setRegistros] = useState([])
    const [itensCatalogo,setItensCatalogo] = useState([])
    const [itemSelecionado,setItemSelecionado] = useState('')
    const [quantidadeSelecionada,setQuantidadeSelecionada] = useState('1')
    const [busca,setBusca] = useState(() => localStorage.getItem('centraltruck_os_busca') || '')
    const [filtroMesOS,setFiltroMesOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_mes') || '')
    const [filtroNumeroOS,setFiltroNumeroOS] = useState(() => localStorage.getItem('centraltruck_os_filtro_numero') || '')
    const [form,setForm] = useState(() => { try { return {...vazio,...JSON.parse(localStorage.getItem('centraltruck_os_rascunho') || '{}')} } catch { return vazio } })
    const [editando,setEditando] = useState(() => localStorage.getItem('centraltruck_os_editando') || null)
    const [mensagem,setMensagem] = useState('')
    const [salvando,setSalvando] = useState(false)
    const [mostrarBusca,setMostrarBusca] = useState(false)
    const [carregandoOS,setCarregandoOS] = useState(false)
    useEffect(() => { localStorage.setItem('centraltruck_os_rascunho',JSON.stringify(form)) },[form])
    useEffect(() => { localStorage.setItem('centraltruck_os_busca',busca) },[busca])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_mes',filtroMesOS) },[filtroMesOS])
    useEffect(() => { localStorage.setItem('centraltruck_os_filtro_numero',filtroNumeroOS) },[filtroNumeroOS])
    useEffect(() => { if(editando) localStorage.setItem('centraltruck_os_editando',editando); else localStorage.removeItem('centraltruck_os_editando') },[editando])
    const registrosFiltrados = registros.filter(item => (!filtroMesOS || String(item.criado_em || '').slice(0,7) === filtroMesOS) && (!filtroNumeroOS || normalizarBusca(item.numero_os).includes(normalizarBusca(filtroNumeroOS.trim()))))
    const selecionada = empresas.find(e=>String(e.id)===String(form.empresa_id))
    const resultados = empresas.filter(e=>normalizarBusca([e.nome_fantasia,e.razao_social,e.nome,e.cnpj,e.telefone,e.whatsapp].join(' ')).includes(normalizarBusca(busca))).slice(0,30)
    async function atualizarOS() {
      setCarregandoOS(true)
      const {data,error}=await supabase.from('ordens_servico').select('*').order('criado_em',{ascending:false})
      setCarregandoOS(false)
      if(error) {setMensagem('Não foi possível consultar as OS: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{atualizarOS()},[])
    useEffect(()=>{supabase.from('catalogo_itens').select('*').order('nome',{ascending:true}).then(({data,error})=>{if(!error)setItensCatalogo(data||[])})},[])
    function adicionarItemCatalogo() {
      const item=itensCatalogo.find(i=>String(i.id)===String(itemSelecionado))
      if(!item){setMensagem('Selecione um produto ou serviço cadastrado.');return}
      const qtd=Math.max(1,Math.floor(Number(quantidadeSelecionada)||1))
      const subtotal=(Number(item.preco)||0)*qtd
      const linha=qtd+' x '+item.nome+' — '+dinheiro(subtotal)
      setForm(v=>item.tipo==='Serviço'
        ?{...v,servicos:[v.servicos,linha].filter(Boolean).join('\n')}
        :{...v,pecas:[v.pecas,linha].filter(Boolean).join('\n'),produto:v.produto||item.nome,valor_produto:(Number(String(v.valor_produto).replace(',','.'))||0)+subtotal})
      setItemSelecionado('');setQuantidadeSelecionada('1');setMensagem('Item incluído. Confira o valor total antes de salvar.')
    }
    function escolherEmpresa(e) {
      setForm(v=>({...v,empresa_id:String(e.id)}))
      setBusca(e.nome_fantasia||e.razao_social||e.nome||'')
      setMostrarBusca(false)
    }
    async function salvar(e) {
      e.preventDefault()
      if(!form.empresa_id) {setMensagem('Selecione um cliente cadastrado na busca.');return}
      setSalvando(true);setMensagem('')
      const payload={numero_os:form.numero_os.trim(),empresa_id:form.empresa_id,servicos:form.servicos,pecas:form.pecas,produto:form.produto,valor_produto:Number(String(form.valor_produto).replace(',','.'))||0,valor:Number(String(form.valor).replace(',','.'))||0,forma_pagamento:form.forma_pagamento}
      const consulta=editando
        ?supabase.from('ordens_servico').update(payload).eq('id',editando)
        :supabase.from('ordens_servico').insert([payload])
      const {error}=await consulta
      setSalvando(false)
      if(error){setMensagem('Erro ao salvar OS: '+error.message);return}
      setForm(vazio);setBusca('');setEditando(null);setMensagem('OS salva com sucesso.')
      await atualizarOS()
    }

    function imprimirPedido(item) {
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))||{}
      const esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
      const campo=(titulo,valor)=>'<div class="campo"><small>'+esc(titulo)+'</small><strong>'+esc(valor||'—')+'</strong></div>'
      const bloco=(titulo,valor)=>'<section><h3>'+esc(titulo)+'</h3><div class="descricao">'+esc(valor||'Não informado')+'</div></section>'
      const data=item.criado_em?dataBR(item.criado_em):dataBR(new Date())
      const nome=cliente.nome_fantasia||cliente.razao_social||cliente.nome||'Cliente cadastrado'
      const total=dinheiro(item.valor)
      const logo=new URL(LOGO,window.location.href).href
      const html=`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pedido de Venda - OS ${esc(item.numero_os)}</title><style>
      @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#20262c;margin:0;font-size:12px}
      header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #19b983;padding-bottom:14px;gap:18px}
      header img{max-width:160px;max-height:78px;object-fit:contain}header .empresa{text-align:right}header .empresa b{font-size:19px;color:#126b54}
      header .empresa p{margin:5px 0;color:#444}h1{font-size:21px;margin:20px 0 5px}h2{font-size:13px;margin:0 0 12px;color:#555;font-weight:normal}
      h3{font-size:13px;background:#e8ecef;padding:9px;margin:18px 0 10px;border-left:4px solid #19b983}
      .grade{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.campo{padding:8px 0;border-bottom:1px solid #ddd;min-width:0;overflow-wrap:anywhere}
      small{display:block;font-size:10px;text-transform:uppercase;color:#666;margin-bottom:4px}.campo strong{font-size:12px;font-weight:600}
      .descricao{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;padding:4px 2px}
      .valor{margin-top:20px;padding:16px;background:#edf5f1;display:flex;justify-content:space-between;font-size:18px;font-weight:bold}
      footer{margin-top:55px;display:flex;gap:40px}footer div{flex:1;text-align:center;border-top:1px solid #777;padding-top:8px;color:#555}
      .acoes{margin:18px 0;display:flex;gap:8px}.acoes button{padding:10px 16px;background:#168b69;color:white;border:0;border-radius:5px;cursor:pointer}
      @media print{.acoes{display:none}header,.valor,h3{-webkit-print-color-adjust:exact;print-color-adjust:exact}section{break-inside:avoid}}
      </style></head><body>
      <div class="acoes"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div>
      <header><img src="${esc(logo)}" alt="Logo Central Truck"><div class="empresa"><b>CENTRAL TRUCK SERVICE</b><p>Oficina especializada em linha diesel</p><p>Contagem - MG</p><p>WhatsApp: (31) 97525-5079</p></div></header>
      <h1>PEDIDO DE VENDA</h1><h2>Ordem de Serviço nº ${esc(item.numero_os)} • Emissão: ${esc(data)}</h2>
      <h3>DADOS DO CLIENTE</h3><div class="grade">
      ${campo('Cliente / Empresa',nome)}${campo('CNPJ',cliente.cnpj)}${campo('Telefone',cliente.telefone||cliente.whatsapp)}
      ${campo('E-mail',cliente.email)}${campo('Cidade / UF',[cliente.cidade,cliente.estado].filter(Boolean).join(' / '))}
      </div>
      ${bloco('SERVIÇOS',item.servicos)}${bloco('PEÇAS E QUANTIDADES',item.pecas)}
      <h3>PRODUTO</h3><div class="grade">${campo('Produto',item.produto)}${campo('Valor do produto',dinheiro(item.valor_produto))}</div>
      <h3>CONDIÇÕES COMERCIAIS</h3><div class="grade">${campo('Forma de pagamento',item.forma_pagamento)}${campo('Data do cadastro',data)}</div>
      <div class="valor"><span>VALOR INFORMADO DA OS</span><span>${esc(total)}</span></div>
      <footer><div>Responsável Central Truck</div><div>Cliente / Responsável</div></footer>
      </body></html>`
      const janela=window.open('','_blank')
      if(!janela){setMensagem('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');return}
      janela.document.open();janela.document.write(html);janela.document.close()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({numero_os:item.numero_os||'',empresa_id:String(item.empresa_id||''),servicos:item.servicos||'',pecas:item.pecas||'',produto:item.produto||'',valor_produto:String(item.valor_produto??''),valor:String(item.valor??''),forma_pagamento:item.forma_pagamento||''})
      const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id))
      setBusca(cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'')
      setMensagem('')
    }
    return <>
      <div className="page-title"><div><h1>Ordens de Serviço</h1><p>Cadastro de OS com vínculo aos clientes existentes.</p></div></div>
      <section className="panel">
        <h2>{editando?'Editar OS':'Nova Ordem de Serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Número da OS *<input required value={form.numero_os} onChange={e=>setForm(v=>({...v,numero_os:e.target.value}))} placeholder="Ex.: 266"/></label>
            <label>Buscar cliente cadastrado *
              <input value={busca} onFocus={()=>setMostrarBusca(true)} onChange={e=>{setBusca(e.target.value);setForm(v=>({...v,empresa_id:''}));setMostrarBusca(true)}} placeholder="Digite nome, CNPJ ou telefone" autoComplete="off"/>
            </label>
          </div>
          {mostrarBusca && <div className="panel" style={{maxHeight:210,overflowY:'auto',padding:8,marginBottom:12}}>
            {resultados.map(e=><button type="button" key={e.id} onClick={()=>escolherEmpresa(e)} style={{display:'block',width:'100%',textAlign:'left',marginBottom:5,background:'#555b63',color:'#fff',border:'1px solid #707780',borderRadius:7}}>{e.nome_fantasia||e.razao_social||e.nome||'Cliente'} — {e.cnpj||e.telefone||e.whatsapp||'Cadastro existente'}</button>)}
            {!resultados.length && <p>Nenhum cliente encontrado. Cadastre em Empresas / Leads.</p>}
          </div>}
          {selecionada && <div className="panel" style={{marginBottom:14,padding:12}}>
            <strong>Cliente vinculado: {selecionada.nome_fantasia||selecionada.razao_social||selecionada.nome}</strong>
            <p>CNPJ: {selecionada.cnpj||'—'} | Telefone: {selecionada.telefone||'—'} | WhatsApp: {selecionada.whatsapp||'—'}</p>
            <p>E-mail: {selecionada.email||'—'} | Cidade: {selecionada.cidade||'—'} / {selecionada.estado||'—'}</p>
          </div>}
          <div className="panel" style={{marginBottom:14,padding:12}}>
            <h3>Adicionar produto ou serviço cadastrado</h3>
            <div className="form-grid">
              <label>Item<select value={itemSelecionado} onChange={e=>setItemSelecionado(e.target.value)}><option value="">Selecione um item</option>{itensCatalogo.map(item=><option key={item.id} value={item.id}>{item.tipo} — {item.nome} — {dinheiro(item.preco)}</option>)}</select></label>
              <label>Quantidade<input type="number" min="1" step="1" value={quantidadeSelecionada} onChange={e=>setQuantidadeSelecionada(e.target.value)}/></label>
            </div>
            <button type="button" onClick={adicionarItemCatalogo}>Adicionar à OS</button>
          </div>
          <div className="form-grid">
            <label>Serviços<textarea rows={4} value={form.servicos} onChange={e=>setForm(v=>({...v,servicos:e.target.value}))} placeholder="Descreva os serviços"/></label>
            <label>Peças<textarea rows={4} value={form.pecas} onChange={e=>setForm(v=>({...v,pecas:e.target.value}))} placeholder="Peças e quantidades"/></label>
            <label>Produto<input value={form.produto} onChange={e=>setForm(v=>({...v,produto:e.target.value}))} placeholder="Nome do produto"/></label>
            <label>Valor do produto (R$)<input type="number" min="0" step="0.01" value={form.valor_produto} onChange={e=>setForm(v=>({...v,valor_produto:e.target.value}))} placeholder="0,00"/></label>
            <label>Valor (R$)<input type="number" min="0" step="0.01" value={form.valor} onChange={e=>setForm(v=>({...v,valor:e.target.value}))}/></label>
            <label>Forma de pagamento<select value={form.forma_pagamento} onChange={e=>setForm(v=>({...v,forma_pagamento:e.target.value}))}>
              <option value="">Selecione</option><option>Pix</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Boleto</option><option>Ticklog</option><option>Faturado</option><option>Transferência bancária</option><option>Outro</option>
            </select></label>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Salvar OS'}</button>
            <button type="button" onClick={()=>{if(!form.numero_os.trim()||!form.empresa_id){setMensagem("Informe o número da OS e selecione um cliente para gerar o pedido.");return} imprimirPedido({...form,numero_os:form.numero_os.trim(),valor:Number(String(form.valor).replace(",","."))||0,valor_produto:Number(String(form.valor_produto).replace(",","."))||0})}} style={{background:"#555b63",color:"#fff",border:"1px solid #737b83",borderRadius:8,padding:"10px 16px",cursor:"pointer"}}>Imprimir / Salvar PDF</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio);setBusca('')}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>OS cadastradas <button type="button" onClick={atualizarOS}>Atualizar</button></h2>
        <div className="form-grid" style={{marginBottom:14}}>
          <label>Buscar por número da OS<input value={filtroNumeroOS} onChange={e=>setFiltroNumeroOS(e.target.value)} placeholder="Ex.: 267" /></label>
          <label>Filtrar por mês<input type="month" value={filtroMesOS} onChange={e=>setFiltroMesOS(e.target.value)} /></label>
        </div>
        {(filtroMesOS || filtroNumeroOS) && <button type="button" onClick={()=>{setFiltroMesOS('');setFiltroNumeroOS('')}} style={{marginBottom:12}}>Limpar filtros</button>}
        {carregandoOS?<p>Carregando...</p>:<table><thead><tr><th>OS</th><th>Cliente</th><th>Serviços</th><th>Peças</th><th>Produto</th><th>Valor do produto</th><th>Valor</th><th>Pagamento</th><th>Ações</th></tr></thead>
          <tbody>{registrosFiltrados.map(item=>{const cliente=empresas.find(e=>String(e.id)===String(item.empresa_id));return <tr key={item.id}>
            <td>{item.numero_os}</td><td>{cliente?.nome_fantasia||cliente?.razao_social||cliente?.nome||'Cliente cadastrado'}</td>
            <td>{item.servicos}</td><td>{item.pecas}</td><td>{item.produto||'—'}</td><td>{dinheiro(item.valor_produto)}</td><td>{dinheiro(item.valor)}</td><td>{item.forma_pagamento}</td>
            <td><button type="button" onClick={()=>editar(item)}>Editar</button> <button type="button" onClick={()=>imprimirPedido(item)}>Pedido / PDF / Imprimir</button></td>
          </tr>})}{!registrosFiltrados.length&&<tr><td colSpan={9}>Nenhuma OS encontrada para os filtros selecionados.</td></tr>}</tbody></table>}
      </section>
    </>
  }


  function Catalogo() {
    const vazio = {tipo:'Produto',nome:'',preco:'',custo:'',preco_manual:false,quantidade_caixa:'10',quantidade_estoque:'',fornecedor:''}
    const [form,setForm] = useState(vazio)
    const [registros,setRegistros] = useState([])
    const [editando,setEditando] = useState(null)
    const [busca,setBusca] = useState('')
    const [tipoFiltro,setTipoFiltro] = useState('Todos')
    const [salvando,setSalvando] = useState(false)
    const [excluindo,setExcluindo] = useState(null)
    const [carregando,setCarregando] = useState(false)
    const [mensagem,setMensagem] = useState('')
    async function carregar() {
      setCarregando(true)
      const {data,error}=await supabase.from('catalogo_itens').select('*').order('nome',{ascending:true})
      setCarregando(false)
      if(error){setMensagem('Erro ao consultar cadastro: '+error.message);return}
      setRegistros(data||[])
    }
    useEffect(()=>{carregar()},[])
    async function salvar(e) {
      e.preventDefault()
      setSalvando(true);setMensagem('')
      const payload={
        tipo:form.tipo,nome:form.nome.trim(),
        preco:Number(String(form.preco).replace(',','.'))||0,
        custo:Number(String(form.custo).replace(',','.'))||0,
        quantidade_caixa:form.tipo==='Produto'?Math.max(1,Number(form.quantidade_caixa)||1):1,
        quantidade_estoque:form.tipo==='Produto'?Math.max(0,Number(form.quantidade_estoque)||0):0,
        fornecedor:form.fornecedor.trim()
      }
      const {error}=editando
        ?await supabase.from('catalogo_itens').update(payload).eq('id',editando)
        :await supabase.from('catalogo_itens').insert([payload])
      setSalvando(false)
      if(error){setMensagem('Não foi possível salvar: '+error.message);return}
      setForm(vazio);setEditando(null);setMensagem('Cadastro salvo com sucesso.');await carregar()
    }
    async function excluir(item) {
      if(!window.confirm('Excluir definitivamente "'+item.nome+'" do cadastro de produtos e serviços?'))return
      setExcluindo(item.id);setMensagem('')
      const {error}=await supabase.from('catalogo_itens').delete().eq('id',item.id)
      setExcluindo(null)
      if(error){setMensagem('Não foi possível excluir: '+error.message);return}
      if(String(editando)===String(item.id)){setEditando(null);setForm(vazio)}
      setMensagem('Cadastro excluído com sucesso.')
      await carregar()
    }
    function editar(item) {
      setEditando(item.id)
      setForm({tipo:item.tipo||'Produto',nome:item.nome||'',preco:String(item.preco??''),custo:String(item.custo??''),preco_manual:true,quantidade_caixa:String(item.quantidade_caixa??10),quantidade_estoque:String(item.quantidade_estoque??0),fornecedor:item.fornecedor||''})
      window.scrollTo({top:0,behavior:'smooth'})
    }
    const filtrados=registros.filter(item=>(tipoFiltro==='Todos'||item.tipo===tipoFiltro)&&normalizarBusca([item.nome,item.fornecedor].join(' ')).includes(normalizarBusca(busca)))
    return <>
      <div className="page-title"><div><h1>Cadastro de Produtos e Serviços</h1><p>Catálogo de preços, fornecedores e quantidades da Central Truck.</p></div></div>
      <section className="panel" style={{marginBottom:18}}>
        <h2>Buscar produtos e serviços</h2>
        <div className="form-grid">
          <label>Pesquisar produto, serviço ou fornecedor<input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Digite o nome do produto ou serviço"/></label>
          <label>Mostrar<select value={tipoFiltro} onChange={e=>setTipoFiltro(e.target.value)}><option>Todos</option><option>Produto</option><option>Serviço</option></select></label>
        </div>
        <p style={{marginTop:10,fontSize:13}}>{filtrados.length} cadastro(s) encontrado(s). {busca||tipoFiltro!=='Todos'?'Veja os resultados na lista abaixo.':'Pesquise para localizar um item já cadastrado.'}</p>
        {(busca||tipoFiltro!=='Todos')&&<button type="button" onClick={()=>{setBusca('');setTipoFiltro('Todos')}}>Limpar busca</button>}
      </section>
      <section className="panel">
        <h2>{editando?'Editar cadastro':'Novo produto ou serviço'}</h2>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <label>Tipo *<select value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))}><option>Produto</option><option>Serviço</option></select></label>
            <label>Nome / descrição *<input required value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))} placeholder="Ex.: Filtro ARLA ou Diagnóstico eletrônico"/></label>
            <label>Valor de custo (R$)<input type="number" min="0" step="0.01" value={form.custo} onChange={e=>setForm(v=>{const custo=e.target.value;const valor=Number(custo)||0;return {...v,custo,preco:v.preco_manual?v.preco:(custo===''?'':(Math.round(valor*1.7*100)/100).toFixed(2))}})} placeholder="0,00"/></label>
            <label>Valor de venda (R$) *<input required type="number" min="0" step="0.01" value={form.preco} onChange={e=>setForm(v=>({...v,preco:e.target.value,preco_manual:true}))} placeholder="Calculado com 70% sobre o custo"/></label>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',paddingBottom:10}}>
              <span style={{fontSize:12}}>Venda sugerida: custo + 70%. Você pode alterar o preço.</span>
              <button type="button" onClick={()=>setForm(v=>({...v,preco_manual:false,preco:v.custo===''?'':(Math.round((Number(v.custo)||0)*1.7*100)/100).toFixed(2)}))}>Aplicar +70%</button>
            </div>
            <label>Fornecedor<input value={form.fornecedor} onChange={e=>setForm(v=>({...v,fornecedor:e.target.value}))} placeholder="Nome do fornecedor"/></label>
            {form.tipo==='Produto' && <>
              <label>Unidades por caixa<input type="number" min="1" step="1" value={form.quantidade_caixa} onChange={e=>setForm(v=>({...v,quantidade_caixa:e.target.value}))} placeholder="10"/></label>
              <label>Quantidade em estoque (unidades)<input type="number" min="0" step="1" value={form.quantidade_estoque} onChange={e=>setForm(v=>({...v,quantidade_estoque:e.target.value}))} placeholder="0"/></label>
            </>}
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="primary" type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Cadastrar'}</button>
            {editando && <button type="button" onClick={()=>{setEditando(null);setForm(vazio)}}>Cancelar edição</button>}
          </div>
        </form>
        {mensagem && <p role="status" style={{marginTop:12}}>{mensagem}</p>}
      </section>
      <section className="panel table-wrap" style={{marginTop:18}}>
        <h2>Produtos e serviços cadastrados <button type="button" onClick={carregar}>Atualizar</button></h2>

        {carregando?<p>Carregando...</p>:<table><thead><tr><th>Tipo</th><th>Produto / Serviço</th><th>Custo</th><th>Venda</th><th>Unid. / caixa</th><th>Estoque</th><th>Fornecedor</th><th>Ações</th></tr></thead><tbody>
          {filtrados.map(item=><tr key={item.id}><td>{item.tipo}</td><td>{item.nome}</td><td>{dinheiro(item.custo)}</td><td>{dinheiro(item.preco)}</td><td>{item.tipo==='Produto'?item.quantidade_caixa:'—'}</td><td>{item.tipo==='Produto'?item.quantidade_estoque:'—'}</td><td>{item.fornecedor||'—'}</td><td><div className="actions"><button type="button" className="btn-editar" onClick={()=>editar(item)}>Editar</button><button type="button" className="btn-excluir" disabled={excluindo===item.id} onClick={()=>excluir(item)}>{excluindo===item.id?"Excluindo...":"Excluir"}</button></div></td></tr>)}
          {!filtrados.length&&<tr><td colSpan={8}>Nenhum cadastro encontrado.</td></tr>}
        </tbody></table>}
      </section>
    </>
  }

  function Conteudo() {
    if (pagina === 'dashboard') return <Dashboard />
    if (pagina === 'empresas') return <Empresas />
    if (pagina === 'funil') return <Funil />
    if (pagina === 'oportunidades') return <Oportunidades />
    if (pagina === 'atendimentos') return <Atendimentos />
    if (pagina === 'agenda') return <Agenda />
    if (pagina === 'orcamentos') return <Orcamentos />
    if (pagina === 'ordens-servico') return <OrdensServico />
    if (pagina === 'catalogo') return <Catalogo />
    if (pagina === 'relatorios') return <Relatorios />
    if (pagina === 'importar') return <ImportarContatos />
    if (pagina === 'configuracoes') return <Configuracoes />
    return <Dashboard />
  }

  return (
    <div className="crm">
      <aside className="sidebar">
        <div className="brand">
          <a href="#" aria-label="Ir para o Dashboard" title="Voltar ao Dashboard" onClick={(event) => { event.preventDefault(); setPagina("dashboard") }} style={{ display: "inline-flex", cursor: "pointer" }}>
            <LogoMark className="brand-logo" />
          </a>
        </div>

        <nav>
          {MENU.map(([id, icone, nome]) => (
            <button
              key={id}
              className={pagina === id ? 'active' : ''}
              onClick={() => setPagina(id)}
            >
              <span>{icone}</span>
              {nome}
            </button>
          ))}
          <button type="button" className="logout-btn" onClick={sair} style={{ width: "100%", marginTop: "12px", textAlign: "left" }}>⇥&nbsp; Sair</button>
        </nav>

        <div className="sidebar-footer">
          <div className="online-dot"></div>
          <div>
            <b>Central Truck</b>
            <span>Sistema online</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="reference-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"24px",flexWrap:"nowrap",position:"relative",width:"100%",boxSizing:"border-box"}}>
          <div className="reference-brand" style={{flex:"0 1 auto",minWidth:0}}>
            <div className="reference-brand-name" style={{fontSize:"clamp(20px, 2.5vw, 34px)",fontWeight:900,letterSpacing:"0.015em",lineHeight:1.05,whiteSpace:"nowrap"}}>CENTRAL TRUCK <span style={{fontSize:"0.46em",letterSpacing:"0.12em",verticalAlign:"middle",whiteSpace:"nowrap"}}>★ SERVICE ★</span></div>
          </div>
          <a className="commercial-phone reference-whatsapp" style={{position:"absolute",right:"18px",top:"50%",transform:"translateY(-50%)",margin:0,flexShrink:0,display:"flex",alignItems:"center",gap:"10px"}} href="https://wa.me/5531975255079" target="_blank" rel="noreferrer">
            <img className="whatsapp-logo-img" src={ZAP_LOGO} alt="WhatsApp" />
            <span className="commercial-copy"><strong>(31) 97525-5079</strong></span>
          </a>
        </header>

        <div className="content">
          {erro && (
            <div className="error-box">
              <b>Não foi possível acessar os dados do Supabase.</b>
              <span>{erro}</span>
              <button onClick={carregarDados}>Tentar novamente</button>
            </div>
          )}

          {carregando ? (
            <div className="loading">
              <div className="loader"></div>
              <b>Carregando Central Truck CRM...</b>
              <span>Buscando informações do banco de dados.</span>
            </div>
          ) : (
            <Conteudo />
          )}
        </div>
      </main>
    </div>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento #root não encontrado no index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
