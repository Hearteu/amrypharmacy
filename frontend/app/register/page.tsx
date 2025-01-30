"use client";

// import { z } from "zod";
import RegisterForm from '../../components/RegisterForm';

// Form schema definition


export default function Register() {

  function handleRegister(values: any) {
    console.log("Registering User:", values);
    // Call API to register user
  }

  return (
    <>
    <div className="flex flex-col justify-center max-w-md mx-auto min-h-screen">
      <h1 className="text-center mb-4 text-2xl font-bold">Register</h1>
      <p className="text-center mb-4 text-sm">Create a new account</p>

      <RegisterForm onSubmit={handleRegister}></RegisterForm>
    
    </div>
    </>

  );
}
