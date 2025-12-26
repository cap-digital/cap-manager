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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        const { data: user, error } = await supabaseAdmin
          .from(TABLES.usuarios)
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !user) {
          throw new Error('Usuário não encontrado')
        }

        if (!user.ativo) {
          throw new Error('Usuário inativo')
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.senha
        )

        if (!isValidPassword) {
          throw new Error('Senha incorreta')
        }

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
      return true
    },
    async jwt({ token, user, account }) {
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
      return token
    },
    async session({ session, token }) {
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
