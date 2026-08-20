import LoginForm from "@/app/login/components/LoginForm";
import { redirectWhenSignedIn } from "@/lib/server/auth/guard";

export default async function LoginPage() {
  await redirectWhenSignedIn();

  return <LoginForm />;
}
