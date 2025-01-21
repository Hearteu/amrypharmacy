// src/pages/persons.js
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Persons = () => {
  useEffect(() => {
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);  // Check if the URL is loaded
    console.log("Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);  // Check if the Key is loaded

    const fetchData = async () => {
      const { data, error } = await supabase.from('Person').select('*').eq('person_id', 1);
      if (error) {
        console.log('Error fetching data:', error.message);
      } else {
        console.log('Fetched data:', data);
      }
      
    };

    fetchData();
  }, []);

  return <div>Check your console for data.</div>;
};

export default Persons;
