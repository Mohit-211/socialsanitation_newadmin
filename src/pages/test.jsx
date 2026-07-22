import React, { useState } from "react";
import {
  Button,
  Cascader,
  Checkbox,
  ColorPicker,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
} from "antd";
import { FaKitMedical } from "react-icons/fa6";

const Test = () => {
  const [userInput, setUserInput] = useState("");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [subs, setSubs] = useState("");

  const calculateAmount = async (pickup, destination, days, subs) => {
    //d=10
    // p=40/km
    let kmsInAdays = "10";
    let Priceperkm = "40";

    let totalAmount = (kmsInAdays * Priceperkm)*subs;

    return totalAmount;
  };

  //grm
 // d=60
 //5
 //22 per month

 



  return (
    <Form
      labelCol={{
        span: 4,
      }}
      wrapperCol={{
        span: 14,
      }}
      layout="horizontal"
      style={{
        maxWidth: 600,
      }}
    >
      <Form.Item label="Pickup location:">
        <Input name="name" />
      </Form.Item>
      <Form.Item label="Destination location:">
        <Input name="name" />
      </Form.Item>
      <Form.Item label="Number of working days:">
        <Radio.Group>
          <Radio value="apple"> 5Days in aweek </Radio>
          <Radio value="pear"> 6 days in a week </Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="Cascader">
        <Cascader
          options={[
            {
              value: "1 month",
              label: " One month",
            },
            {
              value: "2 month",
              label: " Two month",
            },
            {
              value: "3 month",
              label: "Three month",
            },
            {
              value: "4 month",
              label: " One month",
            },
          ]}
        />
      </Form.Item>
      <Form.Item>
        <Button type="dashed" onClick={calculateAmount}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Test;
