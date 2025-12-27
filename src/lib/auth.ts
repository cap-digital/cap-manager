import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { supabaseAdmin, TABLES, Usuario } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] authorize called with email:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials')
          throw new Error('Email e senha são obrigatórios')
        }

        const { data: user, error } = await supabaseAdmin
          .from(TABLES.usuarios)
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !user) {
          console.log('[AUTH] User not found:', error)
          throw new Error('Usuário não encontrado')
        }

        console.log('[AUTH] User found:', user.id, user.email, 'ativo:', user.ativo)

        if (!user.ativo) {
          console.log('[AUTH] User inactive')
          throw new Error('Usuário inativo')
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.senha
        )

        if (!isValidPassword) {
          console.log('[AUTH] Invalid password')
          throw new Error('Senha incorreta')
        }

        console.log('[AUTH] Login successful for user:', user.id)

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.nome,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log('[AUTH] signIn callback - provider:', account?.provider, 'user:', user.email)

      // Para login com Google, criar ou atualizar usuário no banco
      if (account?.provider === 'google' && user.email) {
        const { data: existingUser } = await supabaseAdmin
          .from(TABLES.usuarios)
          .select('*')
          .eq('email', user.email)
          .single()

        if (!existingUser) {
          // Criar novo usuário com dados do Google
          const { error } = await supabaseAdmin
            .from(TABLES.usuarios)
            .insert({
              email: user.email,
              nome: user.name || user.email.split('@')[0],
              senha: '', // Sem senha para usuários Google
              role: 'trader',
              ativo: true,
              avatar_url: user.image || null,
            })

          if (error) {
            console.error('Erro ao criar usuário:', error)
            return false
          }
        } else if (!existingUser.ativo) {
          // Usuário existe mas está inativo
          return false
        } else {
          // Atualizar avatar se mudou
          if (user.image && user.image !== existingUser.avatar_url) {
            await supabaseAdmin
              .from(TABLES.usuarios)
              .update({ avatar_url: user.image })
              .eq('id', existingUser.id)
          }
        }
      }
      console.log('[AUTH] signIn callback returning true')
      return true
    },
    async jwt({ token, user, account }) {
      console.log('[AUTH] jwt callback - user:', user?.email, 'token.id:', token.id)

      if (user) {
        // Para login com Google, buscar dados do banco
        if (account?.provider === 'google' && user.email) {
          const { data: dbUser } = await supabaseAdmin
            .from(TABLES.usuarios)
            .select('*')
            .eq('email', user.email)
            .single()

          if (dbUser) {
            token.id = dbUser.id.toString()
            token.role = dbUser.role
          }
        } else {
          token.id = user.id
          token.role = user.role
        }
      }
      console.log('[AUTH] jwt callback returning token with id:', token.id, 'role:', token.role)
      return token
    },
    async session({ session, token }) {
      console.log('[AUTH] session callback - token.id:', token.id)

      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
}
