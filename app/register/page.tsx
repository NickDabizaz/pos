import RegisterForm from "@/app/register/components/RegisterForm";
import { redirectWhenSignedIn } from "@/lib/server/auth/guard";

export default async function RegisterPage() {
  await redirectWhenSignedIn();

  return <RegisterForm />;
}
