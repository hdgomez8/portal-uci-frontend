export const obtenerSolicitudesCesantias = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            fechaSolicitud: "2025-02-27",
            montoSolicitado: 1500000,
            motivo: "Pago de estudios",
            estado: "Pendiente",
          },
          {
            id: 2,
            fechaSolicitud: "2025-02-25",
            montoSolicitado: 2000000,
            motivo: "Compra de vivienda",
            estado: "Aprobado",
          },
        ]);
      }, 500);
    });
  };
  
  export const solicitarCesantias = async (solicitud: {
    montoSolicitado: number;
    motivo: string;
  }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (solicitud.montoSolicitado > 0 && solicitud.motivo) {
          resolve({ mensaje: "Solicitud enviada correctamente", estado: "Pendiente" });
        } else {
          reject({ mensaje: "Datos inválidos" });
        }
      }, 500);
    });
  };
  