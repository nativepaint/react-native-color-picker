import React from "react";
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { ExampleUncontrolledVertical } from "./ExampleUncontrolledVertical";
import { ExampleControlledVertical } from "./ExampleControlledVertical";
import { ExampleControlledTriangle } from "./ExampleControlledTriangle";
import { ExampleUncontrolledTriangle } from "./ExampleUncontrolledTriangle";

const examples = [
  {
    Component: ExampleUncontrolledVertical,
    title: "Uncontrolled vertical picker"
  },
  { Component: ExampleControlledVertical, title: "Controlled vertical picker" },
  {
    Component: ExampleUncontrolledTriangle,
    title: "Uncontrolled triangle picker"
  },
  { Component: ExampleControlledTriangle, title: "Controlled triangle picker" }
];

export default class App extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = { example: null };
  }

  onColorChange(color) {
    this.setState({ color });
  }

  renderComponent = () => {
    const { Component } = this.state.example
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.touchable, styles.button]}
          onPress={() => this.setState({ example: null })}
        >
          <Text style={styles.text}>Menu</Text>
        </TouchableOpacity>
        <Component />
      </View>
    );
  };
  render() {
    const { example } = this.state;
    return (
      <SafeAreaView style={styles.container}>
        {example && this.renderComponent()}
        {!example && examples.map(example => (
          <TouchableOpacity
            key={example.title}
            style={styles.touchable}
            onPress={() => this.setState({ example })}
          >
            <Text style={styles.text}>{example.title}</Text>
          </TouchableOpacity>
        ))}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#212021",
    alignItems: 'flex-start',
  },
  touchable: {
    padding: 10,
    marginLeft: 25,
  },
  button: {
    backgroundColor: '#494949',
  },
  text: {
    color: "white",
    fontSize: 22
  }
});
