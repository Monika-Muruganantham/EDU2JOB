import { useState } from "react";
import { api } from "../api";
import './EducationForm.css';

export default function EducationForm() {
  const [form, setForm] = useState({
    degree: "",
    specialization: "",
    cgpa: "",
    graduation_year: ""
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: any) => {
    e.preventDefault();

    const payload = {
  degree: form.degree,
  specialization: form.specialization,
  cgpa: Number(form.cgpa),
  graduation_year: Number(form.graduation_year),
};

    await api.updateProfile(payload);



    alert("Education saved");
  };

  return (
    <form onSubmit={submit}>
      <input name="degree" placeholder="Degree" onChange={handleChange} required />
      <input name="specialization" placeholder="Specialization" onChange={handleChange} required />
      <input name="cgpa" type="number" step="0.1" onChange={handleChange} required />
      <input name="graduation_year" type="number" onChange={handleChange} required />
      <button type="submit">Save</button>
    </form>
  );
}
