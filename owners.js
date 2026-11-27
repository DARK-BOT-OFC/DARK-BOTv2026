// owners.js - Configuración centralizada de dueños (Owners) de DARK-BOTv2026

const owners = [
  // [ "Número o LID", "Nombre / Rol", esOwnerVerdadero ]
  ["584123261234", "Carlos (Creador Principal)", true],
  ["28510563336305", "Carlos (LID Principal)", true], // <- Agregamos este para que coincida con tu sesión actual
];

function isOwner(senderJid, conn = null) {
  if (!senderJid) return false;
  
  const cleanNumber = senderJid.replace(/[^0-9]/g, '');
  
  let isListed = owners.some(owner => cleanNumber.includes(owner[0]) || owner[0].includes(cleanNumber));
  if (isListed) return true;

  if (conn && conn.user && conn.user.id) {
    const botNumber = conn.user.id.replace(/[^0-9]/g, '').split(':')[0];
    if (cleanNumber === botNumber) return true;
  }

  return false;
}

module.exports = {
  owners,
  isOwner
};
