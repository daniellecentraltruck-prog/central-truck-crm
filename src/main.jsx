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
  ['decisores', '♙', 'Decisores'],
  ['funil', '◫', 'Funil Comercial'],
  ['oportunidades', '◆', 'Oportunidades'],
  ['atendimentos', '☎', 'Atendimentos'],
  ['agenda', '▤', 'Agenda'],
  ['orcamentos', 'R$', 'Orçamentos'],
  ['relatorios', '▥', 'Relatórios'],
  ['importar', '⇩', 'Importar Contatos'],
  ['configuracoes', '⚙', 'Configurações'],
]

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
  const [pagina, setPagina] = useState('dashboard')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [empresas, setEmpresas] = useState([])
  const [contatos, setContatos] = useState([])
  const [oportunidades, setOportunidades] = useState([])
  const [atividades, setAtividades] = useState([])
  const [tarefas, setTarefas] = useState([])
  const [orcamentos, setOrcamentos] = useState([])

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

  const vendas = oportunidades.filter(
    (o) => o.etapa === 'Venda Realizada'
  )

  const negociacoes = oportunidades.filter(
    (o) => o.etapa === 'Em Negociação'
  )

  const valorOportunidades = oportunidades
    .filter((o) => o.etapa !== 'Venda Perdida')
    .reduce((total, o) => total + Number(o.valor_estimado || 0), 0)

  const valorVendido = vendas.reduce(
    (total, o) => total + Number(o.valor_estimado || 0),
    0
  )

  const conversao = oportunidades.length
    ? ((vendas.length / oportunidades.length) * 100).toFixed(1)
    : '0,0'

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
    const ultimosLeads = empresas.slice(0, 4)
    const proximasTarefas = tarefas
      .filter((t) => t.status !== 'Concluída')
      .slice(0, 4)
    const kpis = [
      ['◎','Total de Leads', empresas.length],
      ['◇','Em Negociação', negociacoes.length],
      ['▥','Vendas Realizadas', vendas.length],
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
          <div className="hero-watermark"><img className="hero-truck-image" src={`${import.meta.env.BASE_URL}Caminhão Volvo FH 540 no Galpão Industrial.png`} alt="Volvo FH 540" /></div>
        </section>

        <section className="kpi-grid">
          {kpis.map(([icone,titulo,valor]) => (
            <div className="kpi-card clickable-card" key={titulo} role="button" tabIndex="0" onClick={() => { const destinos={'Total de Leads':'empresas','Em Negociação':'funil','Vendas Realizadas':'oportunidades','Valor em Oportunidades':'oportunidades','Valor Vendido':'relatorios','Conversão':'relatorios','Retornos Atrasados':'agenda'}; setPagina(destinos[titulo] || 'dashboard') }} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')e.currentTarget.click()}}>
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
              <div><span>Vendas</span><i style={{height:`${Math.min(100,Math.max(8,vendas.length*22))}%`}}></i><b>{vendas.length}</b></div>
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
            <div className="panel-heading"><div><h2>Próximos Atendimentos</h2><p>Retornos e tarefas programadas.</p></div><button onClick={()=>setPagina('agenda')}>Ver agenda →</button></div>
            {proximasTarefas.length ? proximasTarefas.map((t)=><div className="dash-list-row clickable-row" role="button" tabIndex="0" key={t.id} onClick={()=>setPagina('agenda')} onKeyDown={(ev)=>{if(ev.key==='Enter'||ev.key===' ')setPagina('agenda')}}><span className="list-avatar">◷</span><div><b>{t.titulo}</b><small>{nomeEmpresa(t.empresa_id)} · {dataBR(t.data_hora)}</small></div><em>{t.prioridade||'Normal'}</em></div>) : <div className="dash-empty">Nenhum atendimento agendado.</div>}
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
  const [salvando, setSalvando] = useState(false)
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
   const [empresaEditando, setEmpresaEditando] = useState(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState([])
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

  useEffect(() => {
    const salvo = sessionStorage.getItem('empresa_rascunho')
    if (salvo) {
      try { setForm((anterior) => ({ ...anterior, ...JSON.parse(salvo) })) } catch {}
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('empresa_rascunho', JSON.stringify(form))
  }, [form])

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
    pessoa_contato: empresa.pessoa_contato || empresa.nome_fantasia || '',
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
      nome_fantasia: pessoa_contato.trim() || null,
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

    if (!error) {
      const mapaEtapa = {
        'Lead novo': 'Lead Novo',
        'Primeiro contato': 'Primeiro Contato',
        'Interessado': 'Interessado',
        'Visita agendada': 'Visita Agendada',
        'Orçamento enviado': 'Orçamento Enviado',
        'Em negociação': 'Em Negociação',
        'Venda realizada': 'Venda Realizada',
        'Venda perdida': 'Venda Perdida',
        'Pós-venda': 'Pós-venda'
      }
      const etapaFunil = mapaEtapa[form.status] || 'Lead Novo'
      let empresaId = empresaEditando?.id
      if (!empresaId && resultado.data?.[0]?.id) empresaId = resultado.data[0].id
      if (!empresaId && !empresaEditando) {
        const { data: criada } = await supabase.from('empresas').select('id').eq('nome', form.nome.trim()).order('criado_em', { ascending: false }).limit(1).maybeSingle()
        empresaId = criada?.id
      }
      if (empresaId) {
        const { data: existente, error: erroBusca } = await supabase.from('oportunidades').select('id').eq('empresa_id', empresaId).limit(1).maybeSingle()
        let erroFunil = erroBusca
        if (!erroBusca && existente?.id) {
          const { error: erroUpdate } = await supabase.from('oportunidades').update({ etapa: etapaFunil, titulo: form.nome_fantasia.trim() || form.nome.trim() }).eq('id', existente.id)
          erroFunil = erroUpdate
        } else if (!erroBusca) {
          const { error: erroInsert } = await supabase.from('oportunidades').insert([{
            empresa_id: empresaId,
            titulo: form.nome_fantasia.trim() || form.nome.trim(),
            servico: null,
            etapa: etapaFunil,
            valor_estimado: null,
            probabilidade: 0,
            previsao_fechamento: null,
            observacoes: form.observacoes.trim() || null
          }])
          erroFunil = erroInsert
        }
        if (erroFunil) {
          console.error('Erro ao sincronizar funil:', erroFunil)
          setMensagem('Empresa salva, mas houve erro ao sincronizar com o Funil: ' + erroFunil.message)
          setSalvando(false)
          await carregarDados()
          return
        }
      }
    }

    if (error) {
      console.error(error)
      setMensagem('Erro ao cadastrar empresa: ' + error.message)
      setSalvando(false)
      return
    }

    setMensagem('Empresa cadastrada com sucesso!')
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

    await carregarDados()
    setSalvando(false)
    setMostrarFormulario(false)
  setEmpresaEditando(null)
}
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Empresas / Leads</h1>
          <p>Base comercial de clientes e potenciais clientes.</p>
        </div>

        <button
          className="primary"
          onClick={() => {
            setMensagem('')
            setMostrarFormulario(!mostrarFormulario)
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
        <section className="panel" style={{ marginBottom: '20px' }}>
          <h2>Nova Empresa</h2>

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
                  <option value="Troca de Óleo">Troca de Óleo</option>
                  <option value="Oficina - Diesel">Oficina - Diesel</option>
                  <option value="Pessoa Física">Pessoa Física</option>
                  <option value="Indicação">Indicação</option>
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
              empresas.map((empresa) => (
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
              <div className="kanban-column" key={etapa}>
                <div className="kanban-title">
                  <b>{etapa}</b>
                  <span>{itens.length}</span>
                </div>

                {itens.map((item) => (
                 <div className="deal" key={item.id}>
  <b>{item.titulo || nomeEmpresa(item.empresa_id)}</b>
  <span>{nomeEmpresa(item.empresa_id)}</span>
  <strong>{dinheiro(item.valor_estimado)}</strong>

  <select
    value={item.etapa}
    onChange={(e) => moverOportunidade(item.id, e.target.value)}
  >
    {etapas.map((opcao) => (
      <option key={opcao} value={opcao}>
        {opcao}
      </option>
    ))}
  </select>

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
                  <td colSpan="7" className="empty">
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
    const [mostrarFormTarefa, setMostrarFormTarefa] = useState(false)
    const [salvandoTarefa, setSalvandoTarefa] = useState(false)
    const [mensagemTarefa, setMensagemTarefa] = useState('')
    const [tarefaEditandoId, setTarefaEditandoId] = useState(null)
    const [formTarefa, setFormTarefa] = useState({
      empresa_id: '',
      titulo: '',
      descricao: '',
      data_hora: '',
      prioridade: 'Normal',
      status: 'Pendente',
    })

    function editarTarefa(item) {
      setFormTarefa({
        empresa_id: item.empresa_id || '',
        titulo: item.titulo || '',
        descricao: item.descricao || '',
        data_hora: item.data_hora ? String(item.data_hora).slice(0,16) : '',
        prioridade: item.prioridade || 'Normal',
        status: item.status || 'Pendente'
      })
      setTarefaEditandoId(item.id)
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
        descricao: formTarefa.descricao.trim() || null,
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
            <p>Retornos, ligações, visitas e tarefas comerciais.</p>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => { setTarefaEditandoId(null); setFormTarefa({ empresa_id:'', titulo:'', descricao:'', data_hora:'', prioridade:'Normal', status:'Pendente' }); setMostrarFormTarefa(true) }}
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
                  {linkLembreteWhatsApp(tarefa.empresa_id, tarefa.titulo, tarefa.descricao, tarefa.data_hora) && <a className="btn-whatsapp" href={linkLembreteWhatsApp(tarefa.empresa_id, tarefa.titulo, tarefa.descricao, tarefa.data_hora)} target="_blank" rel="noreferrer">WhatsApp</a>}
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
    const [mostrarForm, setMostrarForm] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [orcamentoEditandoId, setOrcamentoEditandoId] = useState(null)
    const [form, setForm] = useState({
      empresa_id: '',
      oportunidade_id: '',
      numero_orcamento: '',
      descricao: '',
      valor: '',
      status: 'Enviado',
      data_envio: new Date().toISOString().slice(0, 10),
      validade: '',
      observacoes: '',
    })

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
            if (mostrarForm) { setMostrarForm(false); setOrcamentoEditandoId(null); return }
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
                    {['Rascunho','Enviado','Visualizado','Em negociação','Aprovado','Recusado'].map((x)=><option key={x}>{x}</option>)}
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

        <section className="panel table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Empresa</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Envio</th><th>Ações</th></tr></thead>
            <tbody>
              {orcamentos.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.numero_orcamento || `#${item.id}`}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.descricao || '—'}</td>
                  <td>{dinheiro(item.valor)}</td>
                  <td><span className="status">{item.status}</span></td>
                  <td>{dataBR(item.data_envio)}</td>
                  <td><div className="actions"><button type="button" className="btn-editar" onClick={() => editarOrcamento(item)}>Editar</button><button type="button" className="btn-excluir" onClick={()=>excluirOrcamento(item.id)}>Excluir</button></div></td>
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
          const mapa = {'Lead novo':'Lead Novo','Primeiro contato':'Primeiro Contato','Interessado':'Interessado','Visita agendada':'Visita Agendada','Orçamento enviado':'Orçamento Enviado','Em negociação':'Em Negociação','Venda realizada':'Venda Realizada','Venda perdida':'Venda Perdida','Pós-venda':'Pós-venda'}
          const { error: erroFunil } = await supabase.from('oportunidades').insert([{
            empresa_id: criada.id,
            titulo: registro.nome_fantasia || registro.nome,
            etapa: mapa[status] || 'Lead Novo',
            probabilidade: 0,
            observacoes: registro.observacoes || null
          }])
          if (erroFunil) falhas++
          else importados++
        }
        await carregarDados()
        setArquivoLeads(null)
        setMsgImportacao(importados + ' cliente(s) importado(s) para Empresas/Leads e Funil.' + (falhas ? ' ' + falhas + ' linha(s) com erro.' : ''))
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
        <section className="panel">
          <h2>Classificação da base</h2>
          <div className="report-bar"><span>Leads A</span><b>{leadsA}</b></div>
          <div className="report-bar"><span>Leads B</span><b>{leadsB}</b></div>
          <div className="report-bar"><span>Leads C</span><b>{leadsC}</b></div>
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
        const ws=wb.Sheets[wb.SheetNames[0]]
        const matriz=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false})
        const indiceCabecalho=matriz.findIndex(linha=>Array.isArray(linha)&&linha.some(c=>['empresa','nome da empresa','razao social'].includes(chave(c))))
        if(indiceCabecalho<0) throw new Error('Não foi encontrada a coluna Empresa na planilha.')
        const cabecalhos=matriz[indiceCabecalho].map(c=>normalizar(c))
        return matriz.slice(indiceCabecalho+1).filter(linha=>linha.some(c=>normalizar(c))).map(linha=>Object.fromEntries(cabecalhos.map((titulo,i)=>[titulo,linha[i]??'']).filter(([titulo])=>titulo)))
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
          const nomeEmpresa=valorCampo(r,['nome da empresa','empresa','razao social','razão social','nome','company','organization','org'])
          const contato=valorCampo(r,['pessoa de contato','contato','responsavel','responsável','nome do contato','nome decisor / contato','contact','contact name'])
          const telefone=valorCampo(r,['telefone','telefone comercial','fone','phone','celular','mobile'])
          const whatsapp=valorCampo(r,['whatsapp','telefone direto / whatsapp','telefone direto whatsapp','whats app','zap']) || telefone
          const email=valorCampo(r,['email','e-mail','e-mail corporativo / público','email corporativo publico','mail'])
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

  function Conteudo() {
    if (pagina === 'dashboard') return <Dashboard />
    if (pagina === 'empresas') return <Empresas />
    if (pagina === 'decisores') return <Decisores />
    if (pagina === 'funil') return <Funil />
    if (pagina === 'oportunidades') return <Oportunidades />
    if (pagina === 'atendimentos') return <Atendimentos />
    if (pagina === 'agenda') return <Agenda />
    if (pagina === 'orcamentos') return <Orcamentos />
    if (pagina === 'relatorios') return <Relatorios />
    if (pagina === 'importar') return <ImportarContatos />
    if (pagina === 'configuracoes') return <Configuracoes />
    return <Dashboard />
  }

  return (
    <div className="crm">
      <aside className="sidebar">
        <div className="brand">
          <LogoMark className="brand-logo" />
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
        </nav>

        <div className="sidebar-bottom-logo">
          <LogoMark className="sidebar-bottom-logo-img" />
          <strong>CENTRAL TRUCK</strong>
          <span>★ SERVICE ★</span>
        </div>

        <div className="sidebar-footer">
          <div className="online-dot"></div>
          <div>
            <b>Central Truck</b>
            <span>Sistema online</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="reference-header">
          <div className="reference-brand">
            <LogoMark className="reference-logo" />
            <div className="reference-brand-name">CENTRAL TRUCK<span>★ SERVICE ★</span></div>
          </div>
          <div className="reference-divider" />
          <a className="commercial-phone reference-whatsapp" href="https://wa.me/5531975255079" target="_blank" rel="noreferrer">
            <img className="whatsapp-logo-img" src={ZAP_LOGO} alt="WhatsApp" />
            <span className="commercial-copy"><small>Fale com nossa comercial</small><b><em>Danielle</em><strong>(31) 97525-5079</strong></b></span>
          </a>
          <div className="user reference-user">
            <div className="avatar">D</div>
            <div>
              <a className="user-email" href="https://mail.google.com/mail/?view=cm&fs=1&to=daniellecentraltruck@gmail.com" target="_blank" rel="noreferrer" title="Abrir Gmail para enviar e-mail">Danielle</a>
              <span>Comercial</span>
            </div>
            <span className="user-chevron">⌄</span>
            <button type="button" className="logout-btn" onClick={sair}>⇥&nbsp; Sair</button>
          </div>
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
