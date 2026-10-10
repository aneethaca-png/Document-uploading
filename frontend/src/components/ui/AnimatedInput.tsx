import { forwardRef } from 'react'
import { Input, InputProps, FormControl, FormLabel, FormErrorMessage } from '@chakra-ui/react'

interface AnimatedInputProps extends InputProps {
  label?: string
  error?: string
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, ...props }, ref) => (
    <FormControl isInvalid={!!error}>
      {label && <FormLabel fontWeight="medium">{label}</FormLabel>}
      <Input
        ref={ref}
        borderRadius="xl"
        borderWidth={2}
        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
        {...props}
      />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  )
)

AnimatedInput.displayName = 'AnimatedInput'
