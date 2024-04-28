// ** MUI Imports
import Slider from '@mui/material/Slider'

const valuetext = value => {
  return { value } + '°' + 'C'
}

const SliderSmallSteps = () => {
  return (
    <Slider
      marks
      step={10}
      defaultValue={40}
      valueLabelDisplay='auto'
      getAriaValueText={valuetext}
      aria-labelledby='small-steps-slider'
    />
  )
}

export default SliderSmallSteps
