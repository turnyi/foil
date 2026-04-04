import { Box } from 'ink'
import InputBox from './InputBox'
import SuggestionList from '../atoms/SuggestionList'
import { useInputBox } from '../../hooks/useInputBox'
import { MAX_SUGGESTIONS } from '../../helpers/suggestions'

const INPUT_BOX_HEIGHT = 5
const SUGGESTION_LIST_HEIGHT = MAX_SUGGESTIONS + 2 // items + paddingY={1} top and bottom

export default function PromptInput() {
  const { value, suggestions, selectedIndex, open } = useInputBox()

  return (
    <Box
      flexDirection="column"
      width={100}
      height={INPUT_BOX_HEIGHT + SUGGESTION_LIST_HEIGHT}
      justifyContent="flex-end"
    >
      {open && <SuggestionList items={suggestions} selectedIndex={selectedIndex} />}
      <InputBox value={value} width={100} />
    </Box>
  )
}
