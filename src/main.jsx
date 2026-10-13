import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './supabase'
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
    carregarDados()
  }, [])

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

  function Dashboard() {
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Dashboard Comercial</h1>
            <p>Visão geral da operação comercial da Central Truck.</p>
          </div>

          <button className="primary" onClick={carregarDados}>
            Atualizar dados
          </button>
        </div>

        <section className="cards">
          <Card titulo="Total de Leads" valor={empresas.length} />
          <Card titulo="Classificação A" valor={leadsA} />
          <Card titulo="Classificação B" valor={leadsB} />
          <Card titulo="Classificação C" valor={leadsC} />
          <Card titulo="Em Negociação" valor={negociacoes.length} />
          <Card titulo="Vendas Realizadas" valor={vendas.length} />
          <Card
            titulo="Valor em Oportunidades"
            valor={dinheiro(valorOportunidades)}
          />
          <Card titulo="Valor Vendido" valor={dinheiro(valorVendido)} />
          <Card titulo="Conversão" valor={`${conversao}%`} />
          <Card titulo="Retornos Atrasados" valor={atrasadas} />
        </section>

        <div className="grid2">
          <section className="panel">
            <div className="panel-title">
              <h2>Serviços Estratégicos</h2>
            </div>

            <div className="services">
              <div>
                <b>Catalisador</b>
                <span>DPF / DOC / SCR</span>
              </div>
              <div>
                <b>ARLA 32</b>
                <span>Diagnóstico e manutenção</span>
              </div>
              <div>
                <b>Diálise</b>
                <span>Limpeza técnica do sistema</span>
              </div>
              <div>
                <b>Diagnóstico</b>
                <span>Análise completa</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <h2>Resumo Comercial</h2>
            </div>

            <div className="summary-row">
              <span>Empresas cadastradas</span>
              <b>{empresas.length}</b>
            </div>
            <div className="summary-row">
              <span>Decisores cadastrados</span>
              <b>{contatos.length}</b>
            </div>
            <div className="summary-row">
              <span>Oportunidades</span>
              <b>{oportunidades.length}</b>
            </div>
            <div className="summary-row">
              <span>Orçamentos</span>
              <b>{orcamentos.length}</b>
            </div>
          </section>
        </div>
      </>
    )
  }

 function Empresas() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
   const [empresaEditando, setEmpresaEditando] = useState(null)
  const [form, setForm] = useState({
    nome: '',
    nome_fantasia: '',
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
    cnpj: empresa.cnpj || '',
    segmento: empresa.segmento || '',
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

    const dados = {
      ...form,
      nome: form.nome.trim(),
      nome_fantasia: form.nome_fantasia.trim() || null,
      cnpj: form.cnpj.trim() || null,
      segmento: form.segmento.trim() || null,
      cidade: form.cidade.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      site: form.site.trim() || null,
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
}

const { error } = resultado

    if (error) {
      console.error(error)
      setMensagem('Erro ao cadastrar empresa: ' + error.message)
      setSalvando(false)
      return
    }

    setMensagem('Empresa cadastrada com sucesso!')

    setForm({
      nome: '',
      nome_fantasia: '',
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
                Nome fantasia
                <input
                  name="nome_fantasia"
                  value={form.nome_fantasia}
                  onChange={alterarCampo}
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
                <input
                  name="segmento"
                  value={form.segmento}
                  onChange={alterarCampo}
                  placeholder="Transportadora, mineração..."
                />
              </label>

              <label>
                Classificação
                <select
                  name="classificacao"
                  value={form.classificacao}
                  onChange={alterarCampo}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
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

              <label>
                Site
                <input
                  name="site"
                  value={form.site}
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
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Classificação</th>
              <th>Segmento</th>
              <th>Cidade</th>
              <th>Telefone</th>
              <th>Status</th><th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {empresas.length > 0 ? (
              empresas.map((empresa) => (
                <tr key={empresa.id}>
                  <td>{empresa.nome_fantasia || empresa.nome}</td>
                  <td>{empresa.classificacao || '-'}</td>
                  <td>{empresa.segmento || '-'}</td>
                  <td>
                    {empresa.cidade || '-'}
                    {empresa.estado ? ` / ${empresa.estado}` : ''}
                  </td>
                  <td>{empresa.telefone || empresa.whatsapp || '-'}</td>
                 <td>{empresa.status || '-'}</td>
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
<td colSpan="7" style={{ textAlign: 'center' }}>                 
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

    const { error } = await supabase
      .from('contatos')
      .insert([{
        empresa_id: formDecisor.empresa_id,
        nome: formDecisor.nome,
        cargo: formDecisor.cargo || null,
        telefone: formDecisor.telefone || null,
        whatsapp: formDecisor.whatsapp || null,
        email: formDecisor.email || null,
        principal: true
      }])

    if (error) {
      console.error('Erro ao salvar decisor:', error)
      setMensagemDecisor('Erro ao salvar: ' + error.message)
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

    setMensagemDecisor('Decisor cadastrado com sucesso!')
    setMostrarFormDecisor(false)
    setSalvandoDecisor(false)
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
  onClick={() => setMostrarFormDecisor(true)}
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
                </tr>
              ))}

              {!contatos.length && (
                <tr>
                  <td colSpan="6" className="empty">
                    Nenhum decisor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        {mostrarFormDecisor && (
  <section className="panel">
    <h2>Novo Decisor</h2>

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

  function Funil() {
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
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Oportunidades</h1>
            <p>Negociações comerciais em andamento.</p>
          </div>
        </div>

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
                </tr>
              ))}

              {!oportunidades.length && (
                <tr>
                  <td colSpan="6" className="empty">
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
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Atendimentos</h1>
            <p>Histórico de contatos e atividades comerciais.</p>
          </div>
        </div>

        <section className="panel">
          {atividades.map((item) => (
            <div className="activity" key={item.id}>
              <div className="activity-icon">✓</div>
              <div>
                <b>{item.tipo || 'Atendimento'}</b>
                <span>{nomeEmpresa(item.empresa_id)}</span>
                <p>{item.descricao || 'Sem descrição.'}</p>
              </div>
              <small>{dataBR(item.data_atividade)}</small>
            </div>
          ))}

          {!atividades.length && (
            <div className="empty">Nenhum atendimento registrado.</div>
          )}
        </section>
      </>
    )
  }

  function Agenda() {
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Agenda</h1>
            <p>Retornos, ligações, visitas e tarefas comerciais.</p>
          </div>
        </div>

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
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Orçamentos</h1>
            <p>Controle dos orçamentos enviados aos clientes.</p>
          </div>
        </div>

        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Empresa</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Envio</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.numero_orcamento || `#${item.id}`}</b></td>
                  <td>{nomeEmpresa(item.empresa_id)}</td>
                  <td>{item.descricao || '—'}</td>
                  <td>{dinheiro(item.valor)}</td>
                  <td><span className="status">{item.status}</span></td>
                  <td>{dataBR(item.data_envio)}</td>
                </tr>
              ))}

              {!orcamentos.length && (
                <tr>
                  <td colSpan="6" className="empty">
                    Nenhum orçamento cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </>
    )
  }

  function Relatorios() {
    return (
      <>
        <div className="page-title">
          <div>
            <h1>Relatórios</h1>
            <p>Indicadores comerciais da Central Truck.</p>
          </div>
        </div>

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

          <div className="report-bar">
            <span>Leads A</span>
            <b>{leadsA}</b>
          </div>
          <div className="report-bar">
            <span>Leads B</span>
            <b>{leadsB}</b>
          </div>
          <div className="report-bar">
            <span>Leads C</span>
            <b>{leadsC}</b>
          </div>
        </section>
      </>
    )
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
    if (pagina === 'configuracoes') return <Configuracoes />
    return <Dashboard />
  }

  return (
    <div className="crm">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">CT</div>
          <div>
            <b>CENTRAL TRUCK</b>
            <span>CRM COMERCIAL</span>
          </div>
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

        <div className="sidebar-footer">
          <div className="online-dot"></div>
          <div>
            <b>Central Truck</b>
            <span>Sistema online</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header>
          <div>
            <b>Central Truck Service</b>
            <span>Gestão Comercial</span>
          </div>

          <div className="user">
            <div className="avatar">D</div>
            <div>
              <b>Danielle</b>
              <span>Comercial</span>
            </div>
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
