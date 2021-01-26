export const handleScrollingHeader = (e, headerShown, setHeaderShown) => {
  const scrollPosition = e.target.scrollTop
  const scrollThreshold = 32

  if (headerShown && scrollPosition < scrollThreshold) {
    setHeaderShown(false)
  } else if (!headerShown && scrollPosition > scrollThreshold) {
    setHeaderShown(true)
  }
}
