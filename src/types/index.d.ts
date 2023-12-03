import { AxiosInstance } from 'axios'
import 'vite/client'
declare global {
  interface Window {
    axios: AxiosInstance
  }
}
export {}