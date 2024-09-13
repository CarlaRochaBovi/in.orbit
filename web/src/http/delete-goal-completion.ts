export async function deleteGoalCompletionHTTP(id: string) {
  await fetch(`http://localhost:3333/completions/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
  })

  // if (!response.ok) {
  //   throw new Error('Erro ao deletar a meta.')
  // }
  // return JSON.parse((response))
}