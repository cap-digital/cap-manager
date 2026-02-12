# Configuração do Resend para Envio de Emails

## Status Atual

✅ **API Key configurada**: `re_3NUXjKus_4HK5c3XRQ1FDoJvbL9SVc2QR`
✅ **Email remetente configurado**: `dados@capdigital.company`
⚠️ **Domínio**: Precisa ser verificado no Resend

## Modo de Teste vs Produção

### Modo Atual (Teste)
- ✅ Envia emails apenas para: `gustavolemos.analytics@gmail.com`
- ❌ **NÃO** envia para outros emails

### Modo Produção (Após verificar domínio)
- ✅ Envia emails para **qualquer endereço**
- ✅ Usa `dados@capdigital.company` como remetente

## Como Verificar o Domínio

1. **Acesse o painel do Resend**:
   https://resend.com/domains

2. **Adicione o domínio `capdigital.company`**

3. **Configure os registros DNS** no seu provedor de domínio (Registro.br, GoDaddy, etc.):

   O Resend fornecerá 3 registros para adicionar:

   - **SPF** (TXT): Para autenticação
   - **DKIM** (TXT): Para assinatura digital
   - **DMARC** (TXT): Para política de rejeição

   Exemplo de registros (os valores reais serão fornecidos pelo Resend):
   ```
   Tipo: TXT
   Nome: @
   Valor: v=spf1 include:_spf.resend.com ~all

   Tipo: TXT
   Nome: resend._domainkey
   Valor: [valor fornecido pelo Resend]

   Tipo: TXT
   Nome: _dmarc
   Valor: v=DMARC1; p=none
   ```

4. **Aguarde a propagação** (pode levar até 48h, mas geralmente é rápido - 15-30min)

5. **Verifique no painel do Resend** - status mudará para "Verified"

## Teste após Verificação

Execute o script de teste:
```bash
node scripts/test-email.mjs
```

Se o domínio estiver verificado, você verá:
```
✅ Email enviado com sucesso!
```

## Alternativa Temporária

Se não puder verificar o domínio agora, todos os emails serão enviados apenas para:
- `gustavolemos.analytics@gmail.com`

## Email Enviados Pelo Sistema

O CAP Manager envia emails para:
1. ✉️ **Tasks criadas** - Para trader, responsável relatório, responsável revisão, observador
2. ✉️ **Menções (@usuario)** - Para usuários mencionados em comentários
3. ✉️ **Webhooks** - Tarefas atribuídas via webhook
4. ✉️ **Alertas customizados** - Notificações do sistema

## Suporte

Se tiver problemas, verifique:
- Logs do servidor: erros aparecem no console como "Erro ao enviar email:"
- Dashboard do Resend: https://resend.com/emails (mostra todos os emails enviados)
- Email do destinatário: verifique a pasta de spam
