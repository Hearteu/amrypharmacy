"use client";

import axios from "axios";
import RegisterForm from '../../components/RegisterForm';

// Form schema definition


export default function Register() {

  const handleRegister = async (values: any) => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/pharmacy/users/", values);

      
    } catch (error) {
      console.log(error)
    }
  };

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

