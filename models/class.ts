import { Student } from './student'
import { School } from './school'
import { StudentPerformance } from './studentPerformance'

export interface Class {
  id: number

  schoolYear: number
  label: string

  school: School

  students?: Student[]

  studentsPerformance?: StudentPerformance[]
}
