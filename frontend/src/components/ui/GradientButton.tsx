import { motion } from 'framer-motion'
import { Button, ButtonProps } from '@chakra-ui/react'

export function GradientButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      as={motion.button as React.ElementType}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      bgGradient="linear(to-r, purple.500, pink.500)"
      color="white"
      _hover={{ bgGradient: 'linear(to-r, purple.600, pink.600)', boxShadow: 'lg' }}
      borderRadius="full"
      fontWeight="semibold"
      {...props}
    >
      {children}
    </Button>
  )
}
