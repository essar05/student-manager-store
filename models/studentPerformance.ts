import { Student } from './student'
import { ActivityScore } from './activityScore'

export interface StudentPerformance {
  id: number

  studentId: string
  classId: number

  student: Student

  activityScores?: ActivityScore[]

  activityPoints?: number
  missingHomeworks?: number
  loudnessWarnings?: number
}
