import { motion } from 'framer-motion'
import { Box, BoxProps } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface PageWrapperProps extends BoxProps {
  children: ReactNode
}

export function PageWrapper({ children, ...props }: PageWrapperProps) {
  return (
    <Box
      as={motion.div as React.ElementType}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.25 } as object}
      minH="100vh"
      {...props}
    >
      {children}
    </Box>
  )
}
