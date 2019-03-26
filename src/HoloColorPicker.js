import React from "react"
import PropTypes from "prop-types"
import Slider from "react-native-slider"
import {
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  InteractionManager,
  I18nManager,
  Text,
} from "react-native"
import tinycolor from "tinycolor2"
import { createPanResponder } from "./utils"

// Used to pass overrides to react-native-sliders
const sliderStyles = {
  thumbTintColor: "white",
}
// Used to dynamically render sliders
const sliderConfig = {
  hasSliders: true,
  sliders: [
    {
      type: "saturation",
      hasLabels: true,
      labelText: "Saturation",
      labelStyle: {},
    },
    { type: "value", hasLabels: true, labelText: "Value", labelStyle: {} },
    { type: "opacity", hasLabels: true, labelText: "Opacity", labelStyle: {} },
  ],
}

export class HoloColorPicker extends React.PureComponent {
  constructor(props, ctx) {
    super(props, ctx)
    const state = {
      color: { h: 0, s: 1, v: 1 },
      pickerSize: null,
      opacity: 1,
    }
    if (props.oldColor) {
      state.color = tinycolor(props.oldColor).toHsv()
    }
    if (props.defaultColor) {
      state.color = tinycolor(props.defaultColor).toHsv()
    }
    this.state = state
    this._layout = { width: 0, height: 0, x: 0, y: 0 }
    this._pageX = 0
    this._pageY = 0
    this._isRTL = I18nManager.isRTL
  }

  static defaultProps = {
    sliderConfig: sliderConfig,
    sliderStyles: sliderStyles,
  };

  _getColor = () => {
    const passedColor =
      typeof this.props.color === "string"
        ? tinycolor(this.props.color).toHsv()
        : this.props.color
    return passedColor || this.state.color
  };

  _getRGBA = () => {
    const { color, opacity } = this.state
    return tinycolor(color)
      .setAlpha(opacity)
      .toRgbString()
  };

  _onColorSelected = () => {
    const { onColorSelected } = this.props
    const color = tinycolor(this._getColor())
      .setAlpha(this.state.opacity)
      .toHex8String()
    onColorSelected && onColorSelected(color)
  };

  _onOldColorSelected = () => {
    const { oldColor, onOldColorSelected } = this.props
    const color = tinycolor(oldColor)
    this.setState({ color: color.toHsv() })
    onOldColorSelected && onOldColorSelected(color.toHexString())
  };

  _onValueChange = ({ saturation, value, opacity }) => {
    const { h, s, v } = this._getColor()
    if (saturation) {
      const color = { h, s: saturation, v }
      return this._onColorChange({ color })
    }
    if (value) {
      const color = { h, s, v: value }
      return this._onColorChange({ color })
    }
    if (opacity) {
      const color = { h, s, v }
      return this._onColorChange({ color, opacity })
    }
  };

  _onColorChange = ({ color, opacity }) => {
    this.setState(state => ({
      color: color || state.color,
      opacity: opacity || state.opacity,
    }))
    if (this.props.onColorChange) {
      this.props.onColorChange(color, opacity)
    }
  };

  _onLayout = l => {
    this._layout = l.nativeEvent.layout
    const { width, height } = this._layout
    const pickerSize = Math.min(width, height)
    if (this.state.pickerSize !== pickerSize) {
      this.setState({ pickerSize })
    }
    // layout.x, layout.y is always 0
    // we always measure because layout is the same even though picker is moved on the page
    InteractionManager.runAfterInteractions(() => {
      // measure only after (possible) animation ended
      this.refs.pickerContainer &&
        this.refs.pickerContainer.measure(
          (x, y, width, height, pageX, pageY) => {
            // picker position in the screen
            this._pageX = pageX
            this._pageY = pageY
          }
        )
    })
  };

  _computeHValue = (x, y) => {
    const mx = this.state.pickerSize / 2
    const my = this.state.pickerSize / 2
    const dx = x - mx
    const dy = y - my
    const rad = Math.atan2(dx, dy) + Math.PI + Math.PI / 2
    return ((rad * 180) / Math.PI) % 360
  };

  _hValueToRad = deg => {
    const rad = (deg * Math.PI) / 180
    return rad - Math.PI - Math.PI / 2
  };

  componentWillMount() {
    const handleColorChange = ({ x, y }) => {
      const { s, v } = this._getColor()
      const marginLeft = (this._layout.width - this.state.pickerSize) / 2
      const marginTop = (this._layout.height - this.state.pickerSize) / 2
      const relativeX = x - this._pageX - marginLeft
      const relativeY = y - this._pageY - marginTop
      const h = this._computeHValue(relativeX, relativeY)
      this._onColorChange({ color: { h, s, v } })
    }
    this._pickerResponder = createPanResponder({
      onStart: handleColorChange,
      onMove: handleColorChange,
    })
  }

  generateSliders = () => {
    const { sliderStyles, sliderConfig } = this.props
    const { opacity } = this.state
    const color = this._getColor()
    const { s: saturation, v: value } = color
    const options = {
      opacity,
      saturation,
      value,
    }
    return sliderConfig.sliders.map((slider, index) => {
      const { type, labelText, hasLabels, labelStyle } = slider
      if (type !== ('saturation' || 'value' || 'opacity')){
        return null
      }
      return (
        <React.Fragment key={`${type}${index}`}>
          { hasLabels && <Text style={[styles.sliderLabelText, labelStyle || {}]}>{labelText}</Text>}
          <Slider
            {...sliderStyles}
            minimumTrackTintColor={this._getRGBA()}
            value={options[type]}
            onValueChange={val => this._onValueChange({ [type]: val })}
          />
        </React.Fragment>
      )
    })
  };

  render() {
    const { pickerSize, opacity } = this.state
    const { hideSliders, oldColor, style, sliderConfig } = this.props
    const color = this._getColor()
    const { h, s, v } = color
    const angle = this._hValueToRad(h)
    const selectedColor = tinycolor({ ...color, a: opacity }).toHex8String()
    const indicatorColor = tinycolor({ h, s: 1, v: 1 }).toHexString()
    const computed = makeComputedStyles({
      pickerSize,
      selectedColor,
      indicatorColor,
      oldColor,
      angle,
      isRTL: this._isRTL,
    })
    return (
      <View style={style}>
        <View
          onLayout={this._onLayout}
          ref="pickerContainer"
          style={styles.pickerContainer}
        >
          {!pickerSize ? null : (
            <View>
              <View
                {...this._pickerResponder.panHandlers}
                style={[styles.picker, computed.picker]}
                collapsable={false}
              >
                <Image
                  source={require("../resources/color-circle.png")}
                  resizeMode="contain"
                  style={[styles.pickerImage]}
                />
                <View
                  style={[styles.pickerIndicator, computed.pickerIndicator]}
                />
              </View>
              {oldColor && (
                <TouchableOpacity
                  style={[styles.selectedPreview, computed.selectedPreview]}
                  onPress={this._onColorSelected}
                  activeOpacity={0.7}
                />
              )}
              {oldColor && (
                <TouchableOpacity
                  style={[styles.originalPreview, computed.originalPreview]}
                  onPress={this._onOldColorSelected}
                  activeOpacity={0.7}
                />
              )}
              {!oldColor && (
                <TouchableOpacity
                  style={[
                    styles.selectedFullPreview,
                    computed.selectedFullPreview,
                  ]}
                  onPress={this._onColorSelected}
                  activeOpacity={0.7}
                />
              )}
            </View>
          )}
        </View>
        {!hideSliders && (
          <View style={styles.sliderContainer}>{this.generateSliders()}</View>
        )}
      </View>
    )
  }
}

HoloColorPicker.propTypes = {
  color: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      h: PropTypes.number,
      s: PropTypes.number,
      v: PropTypes.number,
    }),
  ]),
  defaultColor: PropTypes.string,
  oldColor: PropTypes.string,
  onColorChange: PropTypes.func,
  onColorSelected: PropTypes.func,
  onOldColorSelected: PropTypes.func,
  hideSliders: PropTypes.bool,
  sliderConfig: PropTypes.object,
  sliderOptions: PropTypes.object,
}

const makeComputedStyles = ({
  indicatorColor,
  selectedColor,
  oldColor,
  angle,
  pickerSize,
  isRTL,
}) => {
  const summarySize = 0.5 * pickerSize
  const indicatorPickerRatio = 42 / 510 // computed from picker image
  const indicatorSize = indicatorPickerRatio * pickerSize
  const pickerPadding = indicatorSize / 3
  const indicatorRadius = pickerSize / 2 - indicatorSize / 2 - pickerPadding
  const mx = pickerSize / 2
  const my = pickerSize / 2
  const dx = Math.cos(angle) * indicatorRadius
  const dy = Math.sin(angle) * indicatorRadius
  return {
    picker: {
      padding: pickerPadding,
      width: pickerSize,
      height: pickerSize,
    },
    pickerIndicator: {
      top: mx + dx - indicatorSize / 2,
      [isRTL ? "right" : "left"]: my + dy - indicatorSize / 2,
      width: indicatorSize,
      height: indicatorSize,
      borderRadius: indicatorSize / 2,
      backgroundColor: indicatorColor,
    },
    selectedPreview: {
      width: summarySize / 2,
      height: summarySize,
      top: pickerSize / 2 - summarySize / 2,
      left: Math.floor(pickerSize / 2),
      borderTopRightRadius: summarySize / 2,
      borderBottomRightRadius: summarySize / 2,
      backgroundColor: selectedColor,
    },
    originalPreview: {
      width: Math.ceil(summarySize / 2),
      height: summarySize,
      top: pickerSize / 2 - summarySize / 2,
      left: pickerSize / 2 - summarySize / 2,
      borderTopLeftRadius: summarySize / 2,
      borderBottomLeftRadius: summarySize / 2,
      backgroundColor: oldColor,
    },
    selectedFullPreview: {
      width: summarySize,
      height: summarySize,
      top: pickerSize / 2 - summarySize / 2,
      left: pickerSize / 2 - summarySize / 2,
      borderRadius: summarySize / 2,
      backgroundColor: selectedColor,
    },
  }
}

const styles = StyleSheet.create({
  sliderContainer: { flex: 1 },
  sliderLabelText: {
    color: "white",
  },
  pickerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerImage: {
    flex: 1,
    width: null,
    height: null,
  },
  pickerIndicator: {
    position: "absolute",
    // Shadow only works on iOS.
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 4,

    // This will elevate the view on Android, causing shadow to be drawn.
    elevation: 5,
  },
  selectedPreview: {
    position: "absolute",
    borderLeftWidth: 0,
  },
  originalPreview: {
    position: "absolute",
    borderRightWidth: 0,
  },
  selectedFullPreview: {
    position: "absolute",
  },
  pickerAlignment: {
    alignItems: "center",
  },
})
