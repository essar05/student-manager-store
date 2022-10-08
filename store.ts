import create from 'zustand'
import { Class } from './models/class'
import axios from 'axios'
import produce from 'immer'

export interface Store {
  isAuthenticated?: boolean
  authToken?: string

  classes: Record<number, Class>
  isLoading: boolean
  isInitialized: boolean

  fetch: () => void
  fetchById: (id: number) => void

  addActivityScore: (classId: number, studentPerformanceId: number, score: number) => void
  addActivityPoints: (classId: number, studentPerformanceId: number, points: number) => void
  addMissingHomework: (classId: number, studentPerformanceId: number) => void
  addLoudnessWarning: (classId: number, studentPerformanceId: number) => void

  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
  updateToken: (token: string) => void
}

export const createStore = (apiUrl: string) =>
  create<Store>((set, get) => ({
    authToken: undefined,
    classes: {},
    isLoading: false,
    isInitialized: false,

    fetch: async () => {
      set(() => ({ isLoading: true }))

      try {
        const response = await axios.get(`${apiUrl}/classes`)

        set(
          produce(state => {
            const classes = response.data as Class[]

            classes.forEach(class_ => {
              state.classes[class_.id] = class_
            })

            state.isInitialized = true
            state.isLoading = false
          })
        )
      } catch (e) {
        if (e.response.status === 401) {
        }
        console.error('Error fetching classes', e)
        set(() => ({ isLoading: false }))
      }
    },

    fetchById: async (id: number) => {
      if (!get().isInitialized) {
        await get().fetch()
      }

      set(() => ({ isLoading: true }))

      try {
        const response = await axios.get(`${apiUrl}/classes/${id}`)

        if (!response.data) {
          return
        }

        set(
          produce((state: Store) => {
            state.classes[id] = response.data
            state.isLoading = false
          })
        )
      } catch (e) {
        console.error('Error fetching classes', e)
        set(() => ({ isLoading: false }))
      }
    },

    addActivityScore: async (classId, studentPerformanceId, score) => {
      try {
        const response = await axios.post(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/activityScores`,
          { score }
        )

        if (!response.data) {
          return
        }

        set(
          produce((state: Store) => {
            state.classes[classId] = response.data
          })
        )
      } catch (e) {
        console.error('Error adding activity score', e)
      }
    },

    addActivityPoints: async (classId, studentPerformanceId, points) => {
      try {
        const response = await axios.post(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/activityPoints`,
          { points }
        )

        if (!response.data) {
          return
        }

        set(
          produce((state: Store) => {
            state.classes[classId] = response.data
          })
        )
      } catch (e) {
        console.error('Error adding activity points', e)
      }
    },

    addLoudnessWarning: async (classId, studentPerformanceId) => {
      try {
        const response = await axios.post(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/loudnessWarnings`
        )

        if (!response.data) {
          return
        }

        set(
          produce((state: Store) => {
            state.classes[classId] = response.data
          })
        )
      } catch (e) {
        console.error('Error adding loudness warning', e)
      }
    },

    addMissingHomework: async (classId, studentPerformanceId) => {
      try {
        const response = await axios.post(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/missingHomeworks`
        )

        if (!response.data) {
          return
        }

        set(
          produce((state: Store) => {
            state.classes[classId] = response.data
          })
        )
      } catch (e) {
        console.error('Error adding missing homework', e)
      }
    },

    login: async (username, password) => {
      try {
        const response = await axios.post(
          `${apiUrl}/auth/login`,
          {
            username,
            password,
          },
          {}
        )

        if (!response.data) {
          return
        }

        get().updateToken(response.data.access_token)

        return response.data.access_token
      } catch (e) {
        console.log('Error logging in', e)

        return null
      }
    },

    logout: () => {
      axios.defaults.headers.common['Authorization'] = false

      set(
        produce((state: Store) => {
          state.isAuthenticated = false
          state.authToken = undefined
        })
      )
    },

    updateToken: token => {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      set(
        produce((state: Store) => {
          state.isAuthenticated = true
          state.authToken = token
        })
      )
    },

    wrapApiRequest: (request: () => void) => {
      try {
        request()
      } catch (e) {
        if (e?.response?.status === 401) {
          set(
            produce((state: Store) => {
              state.isAuthenticated = false
            })
          )
        }
      }
    },
  }))
