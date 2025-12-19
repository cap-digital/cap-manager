import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

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

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.ativo) {
          throw new Error('Usuário não encontrado ou inativo')
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
        const existingUser = await prisma.usuario.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // Criar novo usuário com dados do Google
          await prisma.usuario.create({
            data: {
              email: user.email,
              nome: user.name || user.email.split('@')[0],
              senha: '', // Sem senha para usuários Google
              role: 'trader',
              ativo: true,
              avatarUrl: user.image || null,
            },
          })
        } else if (!existingUser.ativo) {
          // Usuário existe mas está inativo
          return false
        } else {
          // Atualizar avatar se mudou
          if (user.image && user.image !== existingUser.avatarUrl) {
            await prisma.usuario.update({
              where: { id: existingUser.id },
              data: { avatarUrl: user.image },
            })
          }
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Para login com Google, buscar dados do banco
        if (account?.provider === 'google' && user.email) {
          const dbUser = await prisma.usuario.findUnique({
            where: { email: user.email },
          })
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
