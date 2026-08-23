import Header from '@/components/Header';
import LoginPageContent from './components/LoginPageContent';

type LoginPageProps = {
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnTo } = await searchParams;
  const requestedReturnTo = typeof returnTo === 'string' ? returnTo : undefined;
  return (
    <main className="dot-pattern-dark min-h-screen bg-background">
      <Header />
      <LoginPageContent returnTo={requestedReturnTo} />
    </main>
  );
}
