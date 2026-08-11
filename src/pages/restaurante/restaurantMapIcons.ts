import * as L from 'leaflet'
import restauranteIconUrl from '@/assets/restaurant-roles/loja.png'
import entregadorIconUrl from '@/assets/restaurant-roles/entregador.png'
import clienteIconUrl from '@/assets/restaurant-roles/cliente.png'

function markerIcon(iconUrl: string) {
  return L.icon({
    iconUrl,
    iconSize: [46, 69],
    iconAnchor: [23, 69],
    popupAnchor: [0, -69],
    tooltipAnchor: [0, -70],
  })
}

export const restaurantMapIcons = {
  restaurante: markerIcon(restauranteIconUrl),
  entregador: markerIcon(entregadorIconUrl),
  cliente: markerIcon(clienteIconUrl),
}
