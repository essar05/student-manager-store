import create from 'zustand'
import { Class } from './models/class'
import axios, { AxiosError } from 'axios'
import produce from 'immer'
import { School } from './models/school'

export interface Store {
  isAuthenticated?: boolean
  authToken?: string

  classes: Record<number, Class>
  isLoading: boolean
  isInitialized: boolean
  error?: string

  schools: {
    entries?: Record<number, School>
    order?: Array<number>
    isLoading?: boolean
  }

  isOperationLoading?: boolean

  fetch: () => void
  fetchById: (id: number) => void

  fetchSchools: () => void

  addActivityScore: (classId: number, studentPerformanceId: number, score: number, immediate?: boolean) => void
  deleteActivityScore: (classId: number, studentPerformanceId: number, id: number, immediate?: boolean) => void
  addActivityPoints: (classId: number, studentPerformanceId: number, points: number, immediate?: boolean) => void
  addMissingHomework: (classId: number, studentPerformanceId: number, amount: number, immediate?: boolean) => void
  deleteLastMissingHomework: (classId: number, studentPerformanceId: number, immediate?: boolean) => void
  addLoudnessWarning: (classId: number, studentPerformanceId: number, immediate?: boolean) => void
  deleteLastLoudnessWarning: (classId: number, studentPerformanceId: number, immediate?: boolean) => void

  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
  updateToken: (token: string) => void

  deleteStudentFromClass: (classId: number, studentToClassId: number) => void
  addStudentToClass: (classId: number, firstName: string, lastName: string) => void
  deleteClass: (classId: number) => void
  addClass: (schoolYear: number, label: string, schoolId: number) => void

  guardUnauthorizedRequest: (request: () => Promise<void>) => void
}

export const createStore = (apiUrl: string) =>
  create<Store>((set, get) => ({
    authToken: undefined,
    classes: {},
    isLoading: false,
    isInitialized: false,

    schools: {},

    fetch: async () => {
      set(() => ({ isLoading: true }))

      try {
        await get().guardUnauthorizedRequest(async () => {
          const response = await axios.get(`${apiUrl}/classes`)

          set(
            produce(state => {
              const classes = response.data as Class[]

              state.classes = {}

              classes.forEach(class_ => {
                state.classes[class_.id] = class_
              })

              state.isInitialized = true
              state.isLoading = false
            })
          )
        })
      } catch (e) {
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
        await get().guardUnauthorizedRequest(async () => {
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
        })
      } catch (e) {
        console.error('Error fetching classes', e)
        set(() => ({ isLoading: false }))
      }
    },

    fetchSchools: async () => {
      set(
        produce((state: Store) => {
          state.schools.isLoading = true
        })
      )

      try {
        await get().guardUnauthorizedRequest(async () => {
          const response = await axios.get(`${apiUrl}/schools`)

          if (!response.data) {
            return
          }

          set(
            produce((state: Store) => {
              const schools = response.data as School[]

              const entries: Record<number, School> = {}
              const order: number[] = []

              schools.forEach(school => {
                order.push(school.id)
                entries[school.id] = school
              })

              state.schools.order = order
              state.schools.entries = entries
              state.schools.isLoading = false
            })
          )
        })
      } catch (e) {
        console.error('Error fetching classes', e)
        set(
          produce((state: Store) => {
            state.schools.isLoading = false
          })
        )
      }
    },

    addActivityScore: async (classId, studentPerformanceId, score) => {
      await get().guardUnauthorizedRequest(async () => {
        const response = await axios.post(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/activityScores`,
          { score }
        )

        if (!response.data) {
          return
        }

        set(
          produce((state: Store) => {
            const sp = state.classes[classId].studentsPerformance?.find(sp => sp.id === studentPerformanceId)

            if (!response.data || !sp) {
              return
            }

            sp.activityScores = sp.activityScores ? [...sp.activityScores, response.data] : [response.data]
          })
        )
      })
    },

    deleteActivityScore: async (classId, studentPerformanceId, id, immediate = true) => {
      if (immediate) {
        set(
          produce((state: Store) => {
            const sp = state.classes[classId].studentsPerformance?.find(sp => sp.id === studentPerformanceId)
            if (sp) {
              const activityScores = sp?.activityScores?.filter(as => as.id !== id)

              sp.activityScores = activityScores
            }
          })
        )
      }

      await get().guardUnauthorizedRequest(async () => {
        const response = await axios.delete(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/activityScores/${id}`
        )

        if (!response.data || immediate) {
          return
        }

        set(
          produce((state: Store) => {
            state.classes[classId] = response.data
          })
        )
      })
    },

    addActivityPoints: async (classId, studentPerformanceId, points, immediate = true) => {
      if (immediate) {
        set(
          produce((state: Store) => {
            const sp = state.classes[classId].studentsPerformance?.find(sp => sp.id === studentPerformanceId)
            if (sp && sp.activityPoints !== undefined) {
              sp.activityPoints += points
            }
          })
        )
      }

      await get().guardUnauthorizedRequest(async () => {
        const response = await axios.post(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/activityPoints`,
          { points }
        )

        if (!response.data || immediate) {
          return
        }

        set(
          produce((state: Store) => {
            state.classes[classId] = response.data
            state.isOperationLoading = false
          })
        )
      })
    },

    addLoudnessWarning: async (classId, studentPerformanceId, immediate = true) => {
      if (immediate) {
        set(
          produce((state: Store) => {
            const sp = state.classes[classId].studentsPerformance?.find(sp => sp.id === studentPerformanceId)
            if (sp && sp.loudnessWarnings !== undefined) {
              sp.loudnessWarnings += 1
            }
          })
        )
      }

      await get().guardUnauthorizedRequest(async () => {
        const response = await axios.post(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/loudnessWarnings`
        )

        if (!response.data || immediate) {
          return
        }

        set(
          produce((state: Store) => {
            state.classes[classId] = response.data
          })
        )
      })
    },

    deleteLastLoudnessWarning: async (classId, studentPerformanceId, immediate = true) => {
      if (immediate) {
        set(
          produce((state: Store) => {
            const sp = state.classes[classId].studentsPerformance?.find(sp => sp.id === studentPerformanceId)
            if (sp && sp.loudnessWarnings !== undefined) {
              sp.loudnessWarnings -= 1
            }
          })
        )
      }

      await get().guardUnauthorizedRequest(async () => {
        const response = await axios.delete(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/loudnessWarnings`
        )

        if (!response.data || immediate) {
          return
        }

        set(
          produce((state: Store) => {
            state.classes[classId] = response.data
          })
        )
      })
    },

    addMissingHomework: async (classId, studentPerformanceId, amount, immediate = true) => {
      if (immediate) {
        set(
          produce((state: Store) => {
            const sp = state.classes[classId].studentsPerformance?.find(sp => sp.id === studentPerformanceId)
            if (sp && sp.missingHomeworks !== undefined) {
              sp.missingHomeworks += amount
            }
          })
        )
      }

      await get().guardUnauthorizedRequest(async () => {
        const response = await axios.post(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/missingHomeworks`,
          {
            amount,
          }
        )

        if (!response.data || immediate) {
          return
        }

        set(
          produce((state: Store) => {
            const sp = state.classes[classId].studentsPerformance?.find(sp => sp.id === studentPerformanceId)
            if (sp) {
              sp.missingHomeworks = response.data
            }
          })
        )
      })
    },

    deleteLastMissingHomework: async (classId, studentPerformanceId, immediate = true) => {
      if (immediate) {
        set(
          produce((state: Store) => {
            const sp = state.classes[classId].studentsPerformance?.find(sp => sp.id === studentPerformanceId)
            if (sp && sp.missingHomeworks !== undefined) {
              sp.missingHomeworks += 1
            }
          })
        )
      }

      await get().guardUnauthorizedRequest(async () => {
        const response = await axios.delete(
          `${apiUrl}/classes/${classId}/studentsPerformance/${studentPerformanceId}/missingHomeworks`
        )

        if (!response.data || immediate) {
          return
        }

        set(
          produce((state: Store) => {
            state.classes[classId] = response.data
          })
        )
      })
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
        console.log('Error logging in', JSON.stringify(e))

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

    deleteStudentFromClass: async (classId: number, studentToClassId: number) => {
      await get().guardUnauthorizedRequest(async () => {
        await axios.delete(`${apiUrl}/classes/${classId}/studentsPerformance/${studentToClassId}`)

        get().fetchById(classId)
      })
    },

    addStudentToClass: async (classId: number, firstName: string, lastName: string) => {
      await get().guardUnauthorizedRequest(async () => {
        await axios.post(`${apiUrl}/classes/${classId}/students`, { firstName, lastName })

        get().fetchById(classId)
      })
    },

    deleteClass: async (classId: number) => {
      await get().guardUnauthorizedRequest(async () => {
        await axios.delete(`${apiUrl}/classes/${classId}`)

        get().fetch()
      })
    },

    addClass: async (schoolYear: number, label: string, schoolId: number) => {
      try {
        await get().guardUnauthorizedRequest(async () => {
          await axios.post(`${apiUrl}/classes`, { schoolYear, label, schoolId })

          set(
            produce((state: Store) => {
              state.error = undefined
            })
          )

          get().fetch()
        })
      } catch (e: any) {
        if (e?.name === 'AxiosError' && e?.response?.status === 400) {
          // @ts-ignore
          const error = (e as AxiosError).response?.data?.message as string | undefined

          if (error) {
            set(
              produce((state: Store) => {
                state.error = error
              })
            )
          }
        }
      }
    },

    guardUnauthorizedRequest: async (request: () => Promise<void>) => {
      try {
        await request()
      } catch (e) {
        console.warn('Caught exception during request. Rethrowing', e)
        if (e?.response?.status === 401) {
          set(
            produce((state: Store) => {
              state.isAuthenticated = false
            })
          )
        }

        throw e
      }
    },
  }))
