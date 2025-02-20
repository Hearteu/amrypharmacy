import RegisterForm from "../../components/forms/RegisterForm";

export default function Register() {
  return (
    <>
      <div className="bg-[#2B2F88]">
        <div className="flex flex-col justify-center max-w-md mx-auto w-5/12 min-h-screen">
          <div className="bg-white p-8 rounded-xl">
            <h1 className="text-center mb-4 text-2xl font-bold">Register</h1>
            <p className="text-center mb-4 text-sm">Create a new account</p>
            <RegisterForm></RegisterForm>
          </div>
        </div>
      </div>
    </>
  );
}
