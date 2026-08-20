
//#region src/graphql/@generated/graphql.ts
/** The availability of the frontend action */
let ActionInputAvailability = /* @__PURE__ */ function(ActionInputAvailability) {
	ActionInputAvailability["Disabled"] = "disabled";
	ActionInputAvailability["Enabled"] = "enabled";
	ActionInputAvailability["Remote"] = "remote";
	return ActionInputAvailability;
}({});
/** The type of Copilot request */
let CopilotRequestType = /* @__PURE__ */ function(CopilotRequestType) {
	CopilotRequestType["Chat"] = "Chat";
	CopilotRequestType["Suggestion"] = "Suggestion";
	CopilotRequestType["Task"] = "Task";
	CopilotRequestType["TextareaCompletion"] = "TextareaCompletion";
	CopilotRequestType["TextareaPopover"] = "TextareaPopover";
	return CopilotRequestType;
}({});
let FailedResponseStatusReason = /* @__PURE__ */ function(FailedResponseStatusReason) {
	FailedResponseStatusReason["GuardrailsValidationFailed"] = "GUARDRAILS_VALIDATION_FAILED";
	FailedResponseStatusReason["MessageStreamInterrupted"] = "MESSAGE_STREAM_INTERRUPTED";
	FailedResponseStatusReason["UnknownError"] = "UNKNOWN_ERROR";
	return FailedResponseStatusReason;
}({});
/** The role of the message */
let MessageRole = /* @__PURE__ */ function(MessageRole) {
	MessageRole["Assistant"] = "assistant";
	MessageRole["Developer"] = "developer";
	MessageRole["System"] = "system";
	MessageRole["Tool"] = "tool";
	MessageRole["User"] = "user";
	return MessageRole;
}({});
let MessageStatusCode = /* @__PURE__ */ function(MessageStatusCode) {
	MessageStatusCode["Failed"] = "Failed";
	MessageStatusCode["Pending"] = "Pending";
	MessageStatusCode["Success"] = "Success";
	return MessageStatusCode;
}({});
/** Meta event types */
let MetaEventName = /* @__PURE__ */ function(MetaEventName) {
	MetaEventName["CopilotKitLangGraphInterruptEvent"] = "CopilotKitLangGraphInterruptEvent";
	MetaEventName["LangGraphInterruptEvent"] = "LangGraphInterruptEvent";
	return MetaEventName;
}({});
let ResponseStatusCode = /* @__PURE__ */ function(ResponseStatusCode) {
	ResponseStatusCode["Failed"] = "Failed";
	ResponseStatusCode["Pending"] = "Pending";
	ResponseStatusCode["Success"] = "Success";
	return ResponseStatusCode;
}({});
const GenerateCopilotResponseDocument = {
	"kind": "Document",
	"definitions": [{
		"kind": "OperationDefinition",
		"operation": "mutation",
		"name": {
			"kind": "Name",
			"value": "generateCopilotResponse"
		},
		"variableDefinitions": [{
			"kind": "VariableDefinition",
			"variable": {
				"kind": "Variable",
				"name": {
					"kind": "Name",
					"value": "data"
				}
			},
			"type": {
				"kind": "NonNullType",
				"type": {
					"kind": "NamedType",
					"name": {
						"kind": "Name",
						"value": "GenerateCopilotResponseInput"
					}
				}
			}
		}, {
			"kind": "VariableDefinition",
			"variable": {
				"kind": "Variable",
				"name": {
					"kind": "Name",
					"value": "properties"
				}
			},
			"type": {
				"kind": "NamedType",
				"name": {
					"kind": "Name",
					"value": "JSONObject"
				}
			}
		}],
		"selectionSet": {
			"kind": "SelectionSet",
			"selections": [{
				"kind": "Field",
				"name": {
					"kind": "Name",
					"value": "generateCopilotResponse"
				},
				"arguments": [{
					"kind": "Argument",
					"name": {
						"kind": "Name",
						"value": "data"
					},
					"value": {
						"kind": "Variable",
						"name": {
							"kind": "Name",
							"value": "data"
						}
					}
				}, {
					"kind": "Argument",
					"name": {
						"kind": "Name",
						"value": "properties"
					},
					"value": {
						"kind": "Variable",
						"name": {
							"kind": "Name",
							"value": "properties"
						}
					}
				}],
				"selectionSet": {
					"kind": "SelectionSet",
					"selections": [
						{
							"kind": "Field",
							"name": {
								"kind": "Name",
								"value": "threadId"
							}
						},
						{
							"kind": "Field",
							"name": {
								"kind": "Name",
								"value": "runId"
							}
						},
						{
							"kind": "Field",
							"name": {
								"kind": "Name",
								"value": "extensions"
							},
							"selectionSet": {
								"kind": "SelectionSet",
								"selections": [{
									"kind": "Field",
									"name": {
										"kind": "Name",
										"value": "openaiAssistantAPI"
									},
									"selectionSet": {
										"kind": "SelectionSet",
										"selections": [{
											"kind": "Field",
											"name": {
												"kind": "Name",
												"value": "runId"
											}
										}, {
											"kind": "Field",
											"name": {
												"kind": "Name",
												"value": "threadId"
											}
										}]
									}
								}]
							}
						},
						{
							"kind": "InlineFragment",
							"typeCondition": {
								"kind": "NamedType",
								"name": {
									"kind": "Name",
									"value": "CopilotResponse"
								}
							},
							"directives": [{
								"kind": "Directive",
								"name": {
									"kind": "Name",
									"value": "defer"
								}
							}],
							"selectionSet": {
								"kind": "SelectionSet",
								"selections": [{
									"kind": "Field",
									"name": {
										"kind": "Name",
										"value": "status"
									},
									"selectionSet": {
										"kind": "SelectionSet",
										"selections": [{
											"kind": "InlineFragment",
											"typeCondition": {
												"kind": "NamedType",
												"name": {
													"kind": "Name",
													"value": "BaseResponseStatus"
												}
											},
											"selectionSet": {
												"kind": "SelectionSet",
												"selections": [{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "code"
													}
												}]
											}
										}, {
											"kind": "InlineFragment",
											"typeCondition": {
												"kind": "NamedType",
												"name": {
													"kind": "Name",
													"value": "FailedResponseStatus"
												}
											},
											"selectionSet": {
												"kind": "SelectionSet",
												"selections": [{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "reason"
													}
												}, {
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "details"
													}
												}]
											}
										}]
									}
								}]
							}
						},
						{
							"kind": "Field",
							"name": {
								"kind": "Name",
								"value": "messages"
							},
							"directives": [{
								"kind": "Directive",
								"name": {
									"kind": "Name",
									"value": "stream"
								}
							}],
							"selectionSet": {
								"kind": "SelectionSet",
								"selections": [
									{
										"kind": "Field",
										"name": {
											"kind": "Name",
											"value": "__typename"
										}
									},
									{
										"kind": "InlineFragment",
										"typeCondition": {
											"kind": "NamedType",
											"name": {
												"kind": "Name",
												"value": "BaseMessageOutput"
											}
										},
										"selectionSet": {
											"kind": "SelectionSet",
											"selections": [{
												"kind": "Field",
												"name": {
													"kind": "Name",
													"value": "id"
												}
											}, {
												"kind": "Field",
												"name": {
													"kind": "Name",
													"value": "createdAt"
												}
											}]
										}
									},
									{
										"kind": "InlineFragment",
										"typeCondition": {
											"kind": "NamedType",
											"name": {
												"kind": "Name",
												"value": "BaseMessageOutput"
											}
										},
										"directives": [{
											"kind": "Directive",
											"name": {
												"kind": "Name",
												"value": "defer"
											}
										}],
										"selectionSet": {
											"kind": "SelectionSet",
											"selections": [{
												"kind": "Field",
												"name": {
													"kind": "Name",
													"value": "status"
												},
												"selectionSet": {
													"kind": "SelectionSet",
													"selections": [
														{
															"kind": "InlineFragment",
															"typeCondition": {
																"kind": "NamedType",
																"name": {
																	"kind": "Name",
																	"value": "SuccessMessageStatus"
																}
															},
															"selectionSet": {
																"kind": "SelectionSet",
																"selections": [{
																	"kind": "Field",
																	"name": {
																		"kind": "Name",
																		"value": "code"
																	}
																}]
															}
														},
														{
															"kind": "InlineFragment",
															"typeCondition": {
																"kind": "NamedType",
																"name": {
																	"kind": "Name",
																	"value": "FailedMessageStatus"
																}
															},
															"selectionSet": {
																"kind": "SelectionSet",
																"selections": [{
																	"kind": "Field",
																	"name": {
																		"kind": "Name",
																		"value": "code"
																	}
																}, {
																	"kind": "Field",
																	"name": {
																		"kind": "Name",
																		"value": "reason"
																	}
																}]
															}
														},
														{
															"kind": "InlineFragment",
															"typeCondition": {
																"kind": "NamedType",
																"name": {
																	"kind": "Name",
																	"value": "PendingMessageStatus"
																}
															},
															"selectionSet": {
																"kind": "SelectionSet",
																"selections": [{
																	"kind": "Field",
																	"name": {
																		"kind": "Name",
																		"value": "code"
																	}
																}]
															}
														}
													]
												}
											}]
										}
									},
									{
										"kind": "InlineFragment",
										"typeCondition": {
											"kind": "NamedType",
											"name": {
												"kind": "Name",
												"value": "TextMessageOutput"
											}
										},
										"selectionSet": {
											"kind": "SelectionSet",
											"selections": [
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "content"
													},
													"directives": [{
														"kind": "Directive",
														"name": {
															"kind": "Name",
															"value": "stream"
														}
													}]
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "role"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "parentMessageId"
													}
												}
											]
										}
									},
									{
										"kind": "InlineFragment",
										"typeCondition": {
											"kind": "NamedType",
											"name": {
												"kind": "Name",
												"value": "ImageMessageOutput"
											}
										},
										"selectionSet": {
											"kind": "SelectionSet",
											"selections": [
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "format"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "bytes"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "role"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "parentMessageId"
													}
												}
											]
										}
									},
									{
										"kind": "InlineFragment",
										"typeCondition": {
											"kind": "NamedType",
											"name": {
												"kind": "Name",
												"value": "ActionExecutionMessageOutput"
											}
										},
										"selectionSet": {
											"kind": "SelectionSet",
											"selections": [
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "name"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "arguments"
													},
													"directives": [{
														"kind": "Directive",
														"name": {
															"kind": "Name",
															"value": "stream"
														}
													}]
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "parentMessageId"
													}
												}
											]
										}
									},
									{
										"kind": "InlineFragment",
										"typeCondition": {
											"kind": "NamedType",
											"name": {
												"kind": "Name",
												"value": "ResultMessageOutput"
											}
										},
										"selectionSet": {
											"kind": "SelectionSet",
											"selections": [
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "result"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "actionExecutionId"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "actionName"
													}
												}
											]
										}
									},
									{
										"kind": "InlineFragment",
										"typeCondition": {
											"kind": "NamedType",
											"name": {
												"kind": "Name",
												"value": "AgentStateMessageOutput"
											}
										},
										"selectionSet": {
											"kind": "SelectionSet",
											"selections": [
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "threadId"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "state"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "running"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "agentName"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "nodeName"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "runId"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "active"
													}
												},
												{
													"kind": "Field",
													"name": {
														"kind": "Name",
														"value": "role"
													}
												}
											]
										}
									}
								]
							}
						},
						{
							"kind": "Field",
							"name": {
								"kind": "Name",
								"value": "metaEvents"
							},
							"directives": [{
								"kind": "Directive",
								"name": {
									"kind": "Name",
									"value": "stream"
								}
							}],
							"selectionSet": {
								"kind": "SelectionSet",
								"selections": [{
									"kind": "InlineFragment",
									"typeCondition": {
										"kind": "NamedType",
										"name": {
											"kind": "Name",
											"value": "LangGraphInterruptEvent"
										}
									},
									"selectionSet": {
										"kind": "SelectionSet",
										"selections": [
											{
												"kind": "Field",
												"name": {
													"kind": "Name",
													"value": "type"
												}
											},
											{
												"kind": "Field",
												"name": {
													"kind": "Name",
													"value": "name"
												}
											},
											{
												"kind": "Field",
												"name": {
													"kind": "Name",
													"value": "value"
												}
											}
										]
									}
								}, {
									"kind": "InlineFragment",
									"typeCondition": {
										"kind": "NamedType",
										"name": {
											"kind": "Name",
											"value": "CopilotKitLangGraphInterruptEvent"
										}
									},
									"selectionSet": {
										"kind": "SelectionSet",
										"selections": [
											{
												"kind": "Field",
												"name": {
													"kind": "Name",
													"value": "type"
												}
											},
											{
												"kind": "Field",
												"name": {
													"kind": "Name",
													"value": "name"
												}
											},
											{
												"kind": "Field",
												"name": {
													"kind": "Name",
													"value": "data"
												},
												"selectionSet": {
													"kind": "SelectionSet",
													"selections": [{
														"kind": "Field",
														"name": {
															"kind": "Name",
															"value": "messages"
														},
														"selectionSet": {
															"kind": "SelectionSet",
															"selections": [
																{
																	"kind": "Field",
																	"name": {
																		"kind": "Name",
																		"value": "__typename"
																	}
																},
																{
																	"kind": "InlineFragment",
																	"typeCondition": {
																		"kind": "NamedType",
																		"name": {
																			"kind": "Name",
																			"value": "BaseMessageOutput"
																		}
																	},
																	"selectionSet": {
																		"kind": "SelectionSet",
																		"selections": [{
																			"kind": "Field",
																			"name": {
																				"kind": "Name",
																				"value": "id"
																			}
																		}, {
																			"kind": "Field",
																			"name": {
																				"kind": "Name",
																				"value": "createdAt"
																			}
																		}]
																	}
																},
																{
																	"kind": "InlineFragment",
																	"typeCondition": {
																		"kind": "NamedType",
																		"name": {
																			"kind": "Name",
																			"value": "BaseMessageOutput"
																		}
																	},
																	"directives": [{
																		"kind": "Directive",
																		"name": {
																			"kind": "Name",
																			"value": "defer"
																		}
																	}],
																	"selectionSet": {
																		"kind": "SelectionSet",
																		"selections": [{
																			"kind": "Field",
																			"name": {
																				"kind": "Name",
																				"value": "status"
																			},
																			"selectionSet": {
																				"kind": "SelectionSet",
																				"selections": [
																					{
																						"kind": "InlineFragment",
																						"typeCondition": {
																							"kind": "NamedType",
																							"name": {
																								"kind": "Name",
																								"value": "SuccessMessageStatus"
																							}
																						},
																						"selectionSet": {
																							"kind": "SelectionSet",
																							"selections": [{
																								"kind": "Field",
																								"name": {
																									"kind": "Name",
																									"value": "code"
																								}
																							}]
																						}
																					},
																					{
																						"kind": "InlineFragment",
																						"typeCondition": {
																							"kind": "NamedType",
																							"name": {
																								"kind": "Name",
																								"value": "FailedMessageStatus"
																							}
																						},
																						"selectionSet": {
																							"kind": "SelectionSet",
																							"selections": [{
																								"kind": "Field",
																								"name": {
																									"kind": "Name",
																									"value": "code"
																								}
																							}, {
																								"kind": "Field",
																								"name": {
																									"kind": "Name",
																									"value": "reason"
																								}
																							}]
																						}
																					},
																					{
																						"kind": "InlineFragment",
																						"typeCondition": {
																							"kind": "NamedType",
																							"name": {
																								"kind": "Name",
																								"value": "PendingMessageStatus"
																							}
																						},
																						"selectionSet": {
																							"kind": "SelectionSet",
																							"selections": [{
																								"kind": "Field",
																								"name": {
																									"kind": "Name",
																									"value": "code"
																								}
																							}]
																						}
																					}
																				]
																			}
																		}]
																	}
																},
																{
																	"kind": "InlineFragment",
																	"typeCondition": {
																		"kind": "NamedType",
																		"name": {
																			"kind": "Name",
																			"value": "TextMessageOutput"
																		}
																	},
																	"selectionSet": {
																		"kind": "SelectionSet",
																		"selections": [
																			{
																				"kind": "Field",
																				"name": {
																					"kind": "Name",
																					"value": "content"
																				}
																			},
																			{
																				"kind": "Field",
																				"name": {
																					"kind": "Name",
																					"value": "role"
																				}
																			},
																			{
																				"kind": "Field",
																				"name": {
																					"kind": "Name",
																					"value": "parentMessageId"
																				}
																			}
																		]
																	}
																},
																{
																	"kind": "InlineFragment",
																	"typeCondition": {
																		"kind": "NamedType",
																		"name": {
																			"kind": "Name",
																			"value": "ActionExecutionMessageOutput"
																		}
																	},
																	"selectionSet": {
																		"kind": "SelectionSet",
																		"selections": [
																			{
																				"kind": "Field",
																				"name": {
																					"kind": "Name",
																					"value": "name"
																				}
																			},
																			{
																				"kind": "Field",
																				"name": {
																					"kind": "Name",
																					"value": "arguments"
																				}
																			},
																			{
																				"kind": "Field",
																				"name": {
																					"kind": "Name",
																					"value": "parentMessageId"
																				}
																			}
																		]
																	}
																},
																{
																	"kind": "InlineFragment",
																	"typeCondition": {
																		"kind": "NamedType",
																		"name": {
																			"kind": "Name",
																			"value": "ResultMessageOutput"
																		}
																	},
																	"selectionSet": {
																		"kind": "SelectionSet",
																		"selections": [
																			{
																				"kind": "Field",
																				"name": {
																					"kind": "Name",
																					"value": "result"
																				}
																			},
																			{
																				"kind": "Field",
																				"name": {
																					"kind": "Name",
																					"value": "actionExecutionId"
																				}
																			},
																			{
																				"kind": "Field",
																				"name": {
																					"kind": "Name",
																					"value": "actionName"
																				}
																			}
																		]
																	}
																}
															]
														}
													}, {
														"kind": "Field",
														"name": {
															"kind": "Name",
															"value": "value"
														}
													}]
												}
											}
										]
									}
								}]
							}
						}
					]
				}
			}]
		}
	}]
};
const AvailableAgentsDocument = {
	"kind": "Document",
	"definitions": [{
		"kind": "OperationDefinition",
		"operation": "query",
		"name": {
			"kind": "Name",
			"value": "availableAgents"
		},
		"selectionSet": {
			"kind": "SelectionSet",
			"selections": [{
				"kind": "Field",
				"name": {
					"kind": "Name",
					"value": "availableAgents"
				},
				"selectionSet": {
					"kind": "SelectionSet",
					"selections": [{
						"kind": "Field",
						"name": {
							"kind": "Name",
							"value": "agents"
						},
						"selectionSet": {
							"kind": "SelectionSet",
							"selections": [
								{
									"kind": "Field",
									"name": {
										"kind": "Name",
										"value": "name"
									}
								},
								{
									"kind": "Field",
									"name": {
										"kind": "Name",
										"value": "id"
									}
								},
								{
									"kind": "Field",
									"name": {
										"kind": "Name",
										"value": "description"
									}
								}
							]
						}
					}]
				}
			}]
		}
	}]
};
const LoadAgentStateDocument = {
	"kind": "Document",
	"definitions": [{
		"kind": "OperationDefinition",
		"operation": "query",
		"name": {
			"kind": "Name",
			"value": "loadAgentState"
		},
		"variableDefinitions": [{
			"kind": "VariableDefinition",
			"variable": {
				"kind": "Variable",
				"name": {
					"kind": "Name",
					"value": "data"
				}
			},
			"type": {
				"kind": "NonNullType",
				"type": {
					"kind": "NamedType",
					"name": {
						"kind": "Name",
						"value": "LoadAgentStateInput"
					}
				}
			}
		}],
		"selectionSet": {
			"kind": "SelectionSet",
			"selections": [{
				"kind": "Field",
				"name": {
					"kind": "Name",
					"value": "loadAgentState"
				},
				"arguments": [{
					"kind": "Argument",
					"name": {
						"kind": "Name",
						"value": "data"
					},
					"value": {
						"kind": "Variable",
						"name": {
							"kind": "Name",
							"value": "data"
						}
					}
				}],
				"selectionSet": {
					"kind": "SelectionSet",
					"selections": [
						{
							"kind": "Field",
							"name": {
								"kind": "Name",
								"value": "threadId"
							}
						},
						{
							"kind": "Field",
							"name": {
								"kind": "Name",
								"value": "threadExists"
							}
						},
						{
							"kind": "Field",
							"name": {
								"kind": "Name",
								"value": "state"
							}
						},
						{
							"kind": "Field",
							"name": {
								"kind": "Name",
								"value": "messages"
							}
						}
					]
				}
			}]
		}
	}]
};

//#endregion
exports.ActionInputAvailability = ActionInputAvailability;
exports.AvailableAgentsDocument = AvailableAgentsDocument;
exports.CopilotRequestType = CopilotRequestType;
exports.FailedResponseStatusReason = FailedResponseStatusReason;
exports.GenerateCopilotResponseDocument = GenerateCopilotResponseDocument;
exports.LoadAgentStateDocument = LoadAgentStateDocument;
exports.MessageRole = MessageRole;
exports.MessageStatusCode = MessageStatusCode;
exports.MetaEventName = MetaEventName;
exports.ResponseStatusCode = ResponseStatusCode;
//# sourceMappingURL=graphql.cjs.map