import { API, authAPI } from "./AuthenticationService";
import { Travel } from "../Interfaces"; 


/**
 * TODO: Hacer el getTravels aplicando filtros. Por ejemplo: origen, destino, fecha...
 */
export const getTravels = async (params) => {
    try {
        const response = await API.get("/travels", { params });
        return response.data;
    } catch (error) {
        throw new Error("Error al obtener los viajes filtrados.");
    }
};

export const getTravel = async (id: string) => {
    if(!id){
        throw new Error('Compruebe el origen y destino')
    }
    const response = await API.get(`travels/${id}`)
    return response.data
}

export const getUserTravels =async () => {
    const response = await authAPI.get("travels/my_travels")
    return response.data
}

export const createTravel = async (data: Partial<Travel>) => {
    const formData = new FormData();
    formData.append("origin", data.origin || "")
    formData.append("destination", data.destination || "")
    formData.append("start_date", data.start_date || "")
    formData.append("estimated_duration", data.estimated_duration || "")
    formData.append("price", data.price?.toString() || "")
    formData.append("stops", data.stops || "")
    formData.append("total_seats", data.total_seats?.toString() || "")
    
    await authAPI.post('travels/create/', formData)
};

export const deleteTravel = async (id: number) => {
    return authAPI.delete(`travels/delete/${id}`)
}

export const getCoordinates = async (location: string) => {
    if(!location){
        throw new Error('Compruebe la localización')
    }
    const response = await API.get(`travels/obtener_latitud_longitud/${location}`)
    return response.data
}

export const getRoute = async (origin: string, destination: string) => {
    if (!origin || !destination) {
      throw new Error('Comprueba las ubicaciones de origen y destino');
    }
  
    const url = `http://localhost:8000/travels/route/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
  
    try {
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener la ruta:', error);
      throw error;
    }
  };




export const getDistanceSearchUser = async (origen: string, destino: string, start_date: string) => {
  try{
    const response = await authAPI.get(`travels/distancia_origen_destino_search/${encodeURIComponent(origen)}/${encodeURIComponent(destino)}/${encodeURIComponent(start_date)}`);
    
    return response.data
  }catch(error){
    console.error('Error a devolver los viajes mas cercanos: ', error)
    return null;
  }
}
