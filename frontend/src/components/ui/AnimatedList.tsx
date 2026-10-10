import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { VStack, StackProps } from '@chakra-ui/react'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

interface AnimatedListProps extends StackProps {
  children: ReactNode[]
}

export function AnimatedList({ children, ...props }: AnimatedListProps) {
  return (
    <VStack
      as={motion.div as React.ElementType}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      align="stretch"
      spacing={3}
      {...props}
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </VStack>
  )
}
