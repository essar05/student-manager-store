import create from 'zustand'
import { Class } from '../models/class'
import axios from 'axios'
import produce from 'immer'

export interface ClassStore {
  classes: Record<number, Class>
  isLoading: boolean
  isInitialized: boolean

  fetch: () => void
  fetchById: (id: number) => void

  addActivityScore: (classId: number, studentPerformanceId: number, score: number) => void
  addActivityPoints: (classId: number, studentPerformanceId: number, points: number) => void
  addMissingHomework: (classId: number, studentPerformanceId: number) => void
  addLoudnessWarning: (classId: number, studentPerformanceId: number) => void
}

export const createClassStore = (apiUrl: string) => create<ClassStore>((set, get) => ({
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
        produce((state: ClassStore) => {
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
        produce((state: ClassStore) => {
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
        produce((state: ClassStore) => {
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
        produce((state: ClassStore) => {
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
        produce((state: ClassStore) => {
          state.classes[classId] = response.data
        })
      )
    } catch (e) {
      console.error('Error adding missing homework', e)
    }
  },
}))
