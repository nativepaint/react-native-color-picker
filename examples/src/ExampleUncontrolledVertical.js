import React from 'react'
import { View, Text } from 'react-native'
import { ColorPicker } from '../module/index' // Swap this to <react-native-color-picker> if you want to see it install normally

export const ExampleUncontrolledVertical = () => (
  <View style={{flex: 1, padding: 15, backgroundColor: '#212021'}}>
    <Text style={{color: 'white'}}>React Native Color Picker - Uncontrolled</Text>
    <ColorPicker
      oldColor='purple'
      onColorSelected={color => alert(`Color selected: ${color}`)}
      style={{flex: 1}}
    />
  </View>
)
