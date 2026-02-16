import { useEffect, useState } from "react";
import axios from "axios";
import "./Services.css";

const BASE_URL = "http://localhost:5000/api/services";
const IMAGE_URL = "http://localhost:5000/uploads/services/";

export default function Services() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    description: "",
    image: null,
    features: "",
    amenities: "",
  });
  const [editingId, setEditingId] = useState(null);

  // 📥 Fetch services
  const fetchServices = async () => {
    const res = await axios.get(BASE_URL);
    setServices(res.data.data);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // ✏ Input handler
  const handleChange = (e) => {
    if (e.target.name === "image") {
      setForm({ ...form, image: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  // ➕ / ✏ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("shortDescription", form.shortDescription);
    formData.append("description", form.description);
    formData.append("features", form.features);
    formData.append("amenities", form.amenities);
    if (form.image) formData.append("image", form.image);

    if (editingId) {
      await axios.put(`${BASE_URL}/${editingId}`, formData);
    } else {
      await axios.post(BASE_URL, formData);
    }

    resetForm();
    fetchServices();
  };

  // ✏ Edit
  const handleEdit = (s) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      shortDescription: s.shortDescription,
      description: s.description,
      image: null,
      features: s.features.join(", "),
      amenities: s.amenities.join(", "),
    });
  };

  // 🗑 Delete
  const handleDelete = async (id) => {
    if (window.confirm("Delete this service?")) {
      await axios.delete(`${BASE_URL}/${id}`);
      fetchServices();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      shortDescription: "",
      description: "",
      image: null,
      features: "",
      amenities: "",
    });
  };

  return (
    <div className="container">
      <h1>🛠 Services Management</h1>

      {/* FORM */}
      <form className="service-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <input name="shortDescription" placeholder="Short Description" value={form.shortDescription} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />

        {/* IMAGE UPLOAD */}
        <input type="file" name="image" accept="image/*" onChange={handleChange} />

        <input name="features" placeholder="Features (comma separated)" value={form.features} onChange={handleChange} />
        <input name="amenities" placeholder="Amenities (comma separated)" value={form.amenities} onChange={handleChange} />

        <button type="submit">{editingId ? "Update Service" : "Add Service"}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>

      {/* LIST */}
      <div className="services-list">
        {services.map((s) => (
          <div key={s.id} className="service-card">
            <img src={`${IMAGE_URL}${s.image}`} alt={s.title} />
            <h3>{s.title}</h3>
            <p>{s.shortDescription}</p>

            <div className="tags">
                <label>Features:</label>
              {s.features.map((f, i) => <span key={i}>{f}</span>)}
            </div>
            <div className="tags">
                <label>Aminities:</label>
              {s.amenities.map((f, i) => <span key={i}>{f}</span>)}
            </div>

            <div className="actions">
              <button onClick={() => handleEdit(s)}>Edit</button>
              <button className="delete" onClick={() => handleDelete(s.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
