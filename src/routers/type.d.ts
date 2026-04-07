export interface IRouters {
  path: string
  name: string
  component: function
  redirect?: string
  meta?: {
    isMenu: boolean
    isHide: boolean
    title: string
    icon: string
  }
  children?: IRouters[]
}
