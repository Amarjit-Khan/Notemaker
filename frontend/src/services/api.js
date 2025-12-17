import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/notes';

const api = {
    getNotes: (status = 'active') => axios.get(`${API_URL}?status=${status}`),
    createNote: (noteData) => axios.post(API_URL, noteData),
    updateNote: (id, noteData) => axios.put(`${API_URL}/${id}`, noteData),
    deleteNote: (id) => axios.delete(`${API_URL}/${id}`),
    emptyTrash: () => axios.delete(`${API_URL}/trash`),
    uploadImage: (formData) => {
        const baseUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api/notes', '') : 'http://localhost:5000';
        return axios.post(`${baseUrl}/api/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
};

export default api;
