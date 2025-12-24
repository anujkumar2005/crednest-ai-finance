# CredNest AI - Financial Planning Platform

A comprehensive AI-powered financial advisor for Indian users with loan comparison, investment tracking, insurance planning, budgeting, and savings goals tracking.

## 🌟 Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Overview of financial metrics and quick access to all modules |
| **Budgeting** | Create monthly budgets by category, track expenses, visual progress tracking |
| **Savings Goals** | Create goals with targets/deadlines, track progress, add savings incrementally |
| **Loans** | Compare loan rates across banks, EMI calculator, filter by loan type |
| **Insurance** | Compare insurance plans, claim ratios, premium ranges |
| **Investments** | Mutual fund comparison, returns tracking, risk indicators |
| **AI Advisor** | AI-powered financial advice with chat history persistence |
| **Profile** | Complete profile management with financial details |

## 🛡️ Security

- ✅ **JWT Authentication** - All edge functions verify JWT tokens server-side
- ✅ **Row-Level Security** - All user data protected with RLS policies
- ✅ **XSS Protection** - Safe markdown rendering with react-markdown
- ✅ **Origin-restricted CORS** - Only localhost and lovable.app domains
- ✅ **Input Validation** - Zod schema validation on all forms

## 🗄️ Database Schema

### User Tables (RLS Protected)
| Table | Description |
|-------|-------------|
| `profiles` | User profile with personal/financial info |
| `budgets` | Monthly budget categories per user |
| `savings_goals` | User savings goals with targets |
| `expenses` | Individual expense records |
| `incomes` | Income source records |
| `user_loans` | User's active loans |
| `chat_sessions` | AI chat sessions |
| `chat_messages` | Chat message history |

### Reference Tables (Public Read)
| Table | Description |
|-------|-------------|
| `banks` | Bank info, loan rates, FD rates |
| `insurance_companies` | Insurance providers, premiums, ratios |
| `investment_funds` | Mutual funds, returns, NAV |
| `financial_corpus` | Knowledge base for AI advisor |

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: Gemini 2.5 Flash via Lovable AI
- **Libraries**: React Query, React Hook Form, Zod, Recharts, date-fns

## 📁 Project Structure

```
src/
├── components/        # UI components
│   ├── layout/       # DashboardLayout, Sidebar
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom hooks (useAuth, use-toast)
├── integrations/     # Supabase client & types
├── lib/              # Utilities
├── pages/            # Page components
supabase/
├── functions/        # Edge functions (ai-chat)
└── migrations/       # Database migrations
```

## 🚀 Getting Started

```bash
npm install && npm run dev
```

Open [http://localhost:8080](http://localhost:8080)

## 📱 Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Landing page |
| `/dashboard` | Required | Main dashboard |
| `/budgeting` | Required | Budget management |
| `/savings` | Required | Savings goals |
| `/loans` | Required | Loan comparison |
| `/insurance` | Required | Insurance comparison |
| `/investments` | Required | Investment tracking |
| `/chat` | Required | AI financial advisor |
| `/profile` | Required | User profile |

## 🔧 Edge Functions

### `ai-chat`
- JWT verification required
- Origin-restricted CORS
- Uses financial_corpus for RAG
- Supports loan/insurance calculations

---

Built with [Lovable](https://lovable.dev) • [Documentation](https://docs.lovable.dev)
