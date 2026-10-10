import { motion } from 'framer-motion'
import { Box, BoxProps } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface GlassCardProps extends BoxProps {
  children: ReactNode
}

export function GlassCard({ children, ...props }: GlassCardProps) {
  return (
    <Box
      as={motion.div as React.ElementType}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 } as object}
      p={6}
      borderRadius="2xl"
      bg="white"
      boxShadow="lg"
      border="1px solid"
      borderColor="gray.100"
      {...props}
    >
      {children}
    </Box>
  )
}
