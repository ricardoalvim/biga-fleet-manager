import React, { useState } from 'react'
import type { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from '../types/portal.types.js'
import { useI18n } from '../i18n/index.js'

interface SupportCenterProps {
  readonly tickets: readonly SupportTicket[]
  readonly onCreateTicket: (ticket: {
    title: string
    description: string
    category: TicketCategory
    priority: TicketPriority
  }) => Promise<void>
  readonly onReplyTicket: (
    ticketId: string,
    reply: { text: string; status?: TicketStatus },
  ) => Promise<void>
}

export const SupportCenter: React.FC<SupportCenterProps> = ({
  tickets,
  onCreateTicket,
  onReplyTicket,
}) => {
  const { t } = useI18n()
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    tickets[0]?.id ?? '',
  )
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [replyText, setReplyText] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Form State
  const [newTitle, setNewTitle] = useState<string>('')
  const [newCategory, setNewCategory] = useState<TicketCategory>('TECHNICAL')
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM')
  const [newDescription, setNewDescription] = useState<string>('')

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newDescription) return
    setSubmitting(true)
    try {
      await onCreateTicket({
        title: newTitle,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
      })
      setIsModalOpen(false)
      setNewTitle('')
      setNewDescription('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (status?: TicketStatus) => {
    if (!selectedTicketId || !replyText.trim()) return
    setSubmitting(true)
    try {
      await onReplyTicket(selectedTicketId, {
        text: replyText,
        status,
      })
      setReplyText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Header com Abertura de Chamado */}
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {t('support.title')}
          </h1>
          <p className="text-xs text-gray-500 mt-1">{t('support.subtitle')}</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          {t('support.openTicket')}
        </button>
      </div>

      {/* Grid: Lista de Chamados + Detalhes/Thread */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Lista de Chamados */}
        <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Seus Chamados ({tickets.length})
          </h2>
          <div className="space-y-2">
            {tickets.map((ticket) => {
              const isSelected = ticket.id === selectedTicketId
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-colors ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-semibold'
                      : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="truncate text-xs font-bold">{ticket.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        ticket.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-700'
                          : ticket.status === 'WAITING_CLIENT'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>{ticket.category}</span>
                    <span className="font-semibold text-gray-600">{ticket.priority}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Coluna 2 e 3: Histórico e Respostas */}
        <div className="md:col-span-2 border rounded-xl p-6 bg-white shadow-sm flex flex-col justify-between min-h-[480px]">
          {selectedTicket ? (
            <>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {selectedTicket.category} • Prioridade {selectedTicket.priority}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-2">
                        {selectedTicket.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {selectedTicket.description}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-800 font-bold rounded-full">
                      Status: {selectedTicket.status}
                    </span>
                  </div>
                </div>

                {/* Mensagens do Thread */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.messageId}
                      className={`p-3 rounded-lg text-xs space-y-1 ${
                        msg.isStaff
                          ? 'bg-blue-50 border border-blue-100 ml-4'
                          : 'bg-gray-50 border border-gray-100 mr-4'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-gray-500">
                        <span className="font-bold text-gray-700">
                          {msg.authorName} {msg.isStaff && '• Suporte Biga'}
                        </span>
                        <span>{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-gray-800 leading-normal">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caixa de Resposta */}
              <div className="pt-4 border-t space-y-3 mt-4">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva sua resposta para o time de engenharia Biga..."
                  className="w-full text-xs p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
                <div className="flex justify-between items-center">
                  <button
                    disabled={submitting || selectedTicket.status === 'RESOLVED'}
                    onClick={() => handleReply('RESOLVED')}
                    className="px-3 py-1.5 border border-green-300 text-green-700 bg-green-50 rounded text-xs font-semibold hover:bg-green-100 disabled:opacity-50"
                  >
                    {t('support.resolve')}
                  </button>

                  <button
                    disabled={submitting || !replyText.trim()}
                    onClick={() => handleReply()}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                  >
                    {submitting ? t('common.loading') : t('support.sendReply')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-xs text-gray-400">
              Selecione um chamado ao lado para visualizar o histórico de mensagens.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Abertura de Chamado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-gray-900">{t('support.openTicket')}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  {t('support.ticketTitle')}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Falha na telemetria do veículo ABC-1234"
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    {t('support.ticketCategory')}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="TECHNICAL">Técnico / Dispositivo</option>
                    <option value="DEVICE_INTEGRATION">Integração IoT / Rastreador</option>
                    <option value="BILLING">Faturamento / Licenças</option>
                    <option value="ONBOARDING">Implantação</option>
                    <option value="GENERAL">Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    {t('support.ticketPriority')}
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica / Parada Total</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  {t('support.ticketDescription')}
                </label>
                <textarea
                  required
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descreva detalhadamente o sintoma, modelo do rastreador ou placa envolvida..."
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? t('common.loading') : 'Criar Chamado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

