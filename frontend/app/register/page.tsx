import RegisterForm from '../../components/forms/RegisterForm';

// Form schema definition


export default function Register() {


  return (
    <>
    <div className="flex flex-col justify-center max-w-md mx-auto min-h-screen">
      <h1 className="text-center mb-4 text-2xl font-bold">Register</h1>
      <p className="text-center mb-4 text-sm">Create a new account</p>

      <RegisterForm></RegisterForm>
    
    </div>
    </>

  );
}

