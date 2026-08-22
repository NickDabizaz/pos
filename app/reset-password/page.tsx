import ResetPasswordForm from "@/app/reset-password/components/ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token, error } = await searchParams;

  return <ResetPasswordForm hasError={Boolean(error)} token={token ?? null} />;
}
