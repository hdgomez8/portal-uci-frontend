export const obtenerSolicitudesVacaciones = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            fechaInicio: "2025-03-10",
            fechaFin: "2025-03-20",
            diasSolicitados: 10,
            motivo: "Descanso anual",
            estado: "Pendiente",
          },
          {
            id: 2,
            fechaInicio: "2025-04-05",
            fechaFin: "2025-04-15",
            diasSolicitados: 10,
            motivo: "Viaje familiar",
            estado: "Aprobado",
          },
        ]);
      }, 500);
    });
  };
  
  export const solicitarVacaciones = async (solicitud: {
    fechaInicio: string;
    fechaFin: string;
    diasSolicitados: number;
    motivo: string;
  }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (solicitud.fechaInicio && solicitud.fechaFin && solicitud.diasSolicitados > 0 && solicitud.motivo) {
          resolve({ mensaje: "Solicitud enviada correctamente", estado: "Pendiente" });
        } else {
          reject({ mensaje: "Datos inválidos" });
        }
      }, 500);
    });
  };
  