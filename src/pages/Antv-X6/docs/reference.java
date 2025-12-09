public PreviousDto queryPreviousNodes(Long nodeId) {
    WorkflowNodeConfig workflowNodeConfig = workflowDomainService.queryWorkflowNode(nodeId);
    if (workflowNodeConfig == null) {
        PreviousDto previousDto = PreviousDto.builder()
                .previousNodes(new ArrayList<>())
                .innerPreviousNodes(new ArrayList<>())
                .argMap(new HashMap<>())
                .build();
        return previousDto;
    }
    List<WorkflowNodeDto> workflowNodeDtos = queryWorkflowNodeList(workflowNodeConfig.getWorkflowId());
    //追加异常处理节点关系
    workflowNodeDtos.forEach(node -> {
        NodeConfigDto nodeConfigDto = node.getNodeConfig();
        if (nodeConfigDto != null && nodeConfigDto.getExceptionHandleConfig() != null) {
            if (ExceptionHandleConfigDto.ExceptionHandleTypeEnum.EXECUTE_EXCEPTION_FLOW == nodeConfigDto.getExceptionHandleConfig().getExceptionHandleType()) {
                List<Long> exceptionHandleNodeIds = nodeConfigDto.getExceptionHandleConfig().getExceptionHandleNodeIds();
                if (!CollectionUtils.isEmpty(exceptionHandleNodeIds) && node.getNextNodeIds() != null) {
                    node.getNextNodeIds().forEach(nextNodeId -> {
                        if (exceptionHandleNodeIds.contains(nextNodeId)) {
                            exceptionHandleNodeIds.remove(nextNodeId);
                        }
                    });
                    node.getNextNodeIds().addAll(exceptionHandleNodeIds);
                }
            }
        }
    });
    //排序
    //workflowNodeDtos转map
    Map<Long, WorkflowNodeDto> workflowNodeDtoMap = workflowNodeDtos.stream().collect(Collectors.toMap(WorkflowNodeDto::getId, workflowNodeDto -> workflowNodeDto));
    WorkflowNodeDto startNode = workflowNodeDtos.stream().filter(workflowNodeDto -> workflowNodeDto.getType() == WorkflowNodeConfig.NodeType.Start).findFirst().orElse(null);
    if (startNode == null) {
        throw new BizException("未找到起始节点");
    }
    WorkflowNodeDto nodeDto = workflowNodeDtoMap.get(nodeId);
    PreviousDto previousDto = generatePreviousNodes(workflowNodeDtos, nodeId);
    //设置previousDto.getPreviousNodes()中sort默认为0
    previousDto.getPreviousNodes().forEach(previousNodeDto -> previousNodeDto.setSort(Integer.MAX_VALUE));
    //previousDto.getPreviousNodes() 转map
    Map<Long, PreviousNodeDto> previousNodeDtoMap = previousDto.getPreviousNodes().stream().collect(Collectors.toMap(PreviousNodeDto::getId, previousNodeDto -> previousNodeDto, (previousNodeDto, previousNodeDto2) -> previousNodeDto));
    if (!CollectionUtils.isEmpty(nodeDto.getPreNodes())) {
        AtomicInteger sort = new AtomicInteger(0);
        WorkflowNodeDto workflowNodeDto = workflowNodeDtoMap.get(startNode.getId());
        PreviousNodeDto previousNodeDto = previousNodeDtoMap.get(startNode.getId());
        if (previousNodeDto != null && workflowNodeDto != null) {
            previousNodeDto.setSort(sort.getAndIncrement());
            //排过序的节点不再排序
            Set<Long> sortedIdSet = new HashSet<>();
            sortPreviousNodes(startNode.getNextNodeIds(), workflowNodeDtoMap, previousNodeDtoMap, sort, sortedIdSet);
        }
    }
    //previousDto.getPreviousNodes()中sort从大到小排序，相同的用id从小到大排序
    previousDto.getPreviousNodes().sort((o1, o2) -> {
        if (o1.getSort().equals(o2.getSort())) {
            return o1.getId().compareTo(o2.getId());
        }
        return o1.getSort().compareTo(o2.getSort());
    });
    return previousDto;
}
private PreviousDto generatePreviousNodes(List<WorkflowNodeDto> workflowNodeDtos, Long nodeId) {
    List<PreviousNodeDto> previousNodes = new ArrayList<>();
    List<PreviousNodeDto> innerPreviousNodes = new ArrayList<>();
    Map<String, Arg> argMap = new HashMap<>();
    //workflowNodeDtos根据ID转map,补充完善每个节点的上级节点列表
    Map<Long, WorkflowNodeDto> workflowNodeDtoMap = workflowNodeDtos.stream().collect(Collectors.toMap(WorkflowNodeDto::getId, workflowNodeDto -> workflowNodeDto));
    workflowNodeDtos.forEach(workflowNodeDto -> {
        if (workflowNodeDto.getNextNodeIds() != null) {
            if (workflowNodeDto.getLoopNodeId() != null) {
                workflowNodeDto.getNextNodeIds().remove(workflowNodeDto.getLoopNodeId());
            }
            workflowNodeDto.getNextNodeIds().forEach(nextNodeId -> {
                WorkflowNodeDto next = workflowNodeDtoMap.get(nextNodeId);
                if (next != null) {
                    if (next.getPreNodes() == null) {
                        next.setPreNodes(new ArrayList<>());
                    }
                    if (!next.getPreNodes().contains(workflowNodeDto)) {
                        next.getPreNodes().add(workflowNodeDto);
                    }
                }
            });
        }
        //补充变量输出
        if (workflowNodeDto.getType() == WorkflowNodeConfig.NodeType.Variable) {
            VariableNodeConfigDto variableNodeConfigDto = (VariableNodeConfigDto) workflowNodeDto.getNodeConfig();
            if (variableNodeConfigDto.getConfigType() == VariableNodeConfigDto.ConfigTypeEnum.SET_VARIABLE) {
                variableNodeConfigDto.setOutputArgs(List.of(Arg.builder().dataType(DataTypeEnum.Boolean).name("isSuccess").build()));
            }
        }
    });
    //获取指定节点的所有参数，根据入参节点id过滤workflowNodeDtos
    WorkflowNodeDto workflowNodeDto = workflowNodeDtoMap.get(nodeId);
    if (workflowNodeDto == null) {
        PreviousDto previousDto = new PreviousDto();
        previousDto.setPreviousNodes(previousNodes);
        previousDto.setInnerPreviousNodes(innerPreviousNodes);
        previousDto.setArgMap(argMap);
        return previousDto;
    }
    //移除上级节点连成死循环
    removeDeadLoopPreNodes(workflowNodeDto, workflowNodeDtoMap);
    setPreviousNodes(previousNodes, argMap, workflowNodeDto.getPreNodes(), workflowNodeDtoMap);
    //循环节点外部节点也可以作为参数
    if (CollectionUtils.isEmpty(workflowNodeDto.getPreNodes()) && workflowNodeDto.getLoopNodeId() != null && workflowNodeDto.getLoopNodeId() > 0) {
        WorkflowNodeDto loopNode = workflowNodeDtoMap.get(workflowNodeDto.getLoopNodeId());
        if (loopNode != null && loopNode.getInnerStartNodeId() != null && loopNode.getInnerStartNodeId() == workflowNodeDto.getId().longValue()) {
            setPreviousNodes(previousNodes, argMap, loopNode.getPreNodes(), workflowNodeDtoMap);
        }
    }
    if (workflowNodeDto.getType() == WorkflowNodeConfig.NodeType.Loop) {
        WorkflowNodeDto loopEndNode = workflowNodeDtoMap.get(workflowNodeDto.getInnerEndNodeId());
        if (loopEndNode != null) {
            loopEndNode.setNextNodeIds(null);
            setPreviousNodes(innerPreviousNodes, argMap, List.of(loopEndNode), workflowNodeDtoMap);
            innerPreviousNodes = innerPreviousNodes.stream().filter(innerNode -> innerNode.getLoopNodeId() != null && innerNode.getLoopNodeId().longValue() == nodeId.longValue()).collect(Collectors.toList());
            innerPreviousNodes.forEach(innerNode -> {
                //类型全部改成Array
                if (!CollectionUtils.isEmpty(innerNode.getOutputArgs())) {
                    innerNode.getOutputArgs().forEach(outputArg -> {
                        outputArg.setOriginDataType(outputArg.getDataType());
                        if (outputArg.getDataType() == null) {
                            outputArg.setDataType(DataTypeEnum.Array_Object);
                        } else {
                            if (outputArg.getDataType().name().startsWith("Array")) {
                                outputArg.setDataType(DataTypeEnum.Array_Object);
                            } else {
                                try {
                                    outputArg.setDataType(DataTypeEnum.valueOf("Array_" + outputArg.getDataType().name()));
                                } catch (Exception e) {
                                    //不处理
                                }
                            }
                        }
                    });
                }
            });
        }
        //循环节点变量也可作为输出可选范围
        LoopNodeConfigDto loopNodeConfigDto = (LoopNodeConfigDto) workflowNodeDto.getNodeConfig();
        if (!CollectionUtils.isEmpty(loopNodeConfigDto.getVariableArgs())) {
            List<Arg> varOutputArgs = new ArrayList<>();
            loopNodeConfigDto.getVariableArgs().forEach(inputArg -> {
                OutputArg outputArg = new OutputArg();
                BeanUtils.copyProperties(inputArg, outputArg);
                if (inputArg.getBindValueType() == Arg.BindValueType.Reference) {
                    Arg arg = argMap.get(inputArg.getBindValue());
                    if (arg != null) {
                        outputArg.setSubArgs(arg.getSubArgs());
                        varOutputArgs.add(outputArg);
                    }
                } else {
                    varOutputArgs.add(outputArg);
                }
            });
            generateKey(workflowNodeDto.getId() + "-var", varOutputArgs, argMap);
            PreviousNodeDto previousNodeDto = new PreviousNodeDto();
            previousNodeDto.setId(workflowNodeDto.getId());
            previousNodeDto.setName(workflowNodeDto.getName());
            previousNodeDto.setOutputArgs(varOutputArgs);
            previousNodeDto.setType(workflowNodeDto.getType());
            if (!innerPreviousNodes.contains(previousNodeDto)) {
                innerPreviousNodes.add(previousNodeDto);
            }
        }
    }
    if (workflowNodeDto.getLoopNodeId() != null && workflowNodeDto.getLoopNodeId() > 0) {
        WorkflowNodeDto loopNode = workflowNodeDtoMap.get(workflowNodeDto.getLoopNodeId());
        if (loopNode != null) {
            //循环节点绑定的数组和变量也可作为参数
            List<Arg> outputArgs = new ArrayList<>();
            LoopNodeConfigDto loopNodeConfigDto = (LoopNodeConfigDto) loopNode.getNodeConfig();
            if (loopNodeConfigDto != null) {
                if (!CollectionUtils.isEmpty(loopNodeConfigDto.getInputArgs())) {
                    loopNodeConfigDto.getInputArgs().forEach(inputArg -> {
                        if (inputArg.getBindValueType() == Arg.BindValueType.Input) {
                            return;
                        }
                        Arg arg = argMap.get(inputArg.getBindValue());
                        if (arg != null && arg.getDataType().name().startsWith("Array")) {
                            OutputArg outputArg = new OutputArg();
                            BeanUtils.copyProperties(inputArg, outputArg);
                            outputArg.setName(inputArg.getName() + "_item");
                            try {
                                outputArg.setDataType(DataTypeEnum.valueOf(arg.getDataType().name().replace("Array_", "")));
                            } catch (Exception e) {
                                //不处理
                                outputArg.setDataType(DataTypeEnum.Object);
                            }
                            List<Arg> subArgs = (List<Arg>) JsonSerializeUtil.deepCopy(arg.getSubArgs());
                            outputArg.setSubArgs(subArgs);
                            outputArgs.add(outputArg);
                        }
                    });
                }
                OutputArg indexOutputArg = new OutputArg();
                indexOutputArg.setName(SystemArgNameEnum.INDEX.name());
                indexOutputArg.setDataType(DataTypeEnum.Integer);
                indexOutputArg.setSystemVariable(true);
                indexOutputArg.setDescription("数组索引");
                outputArgs.add(indexOutputArg);
                generateKey(loopNode.getId() + "-input", outputArgs, argMap);
                if (!CollectionUtils.isEmpty(loopNodeConfigDto.getVariableArgs())) {
                    List<Arg> varOutputArgs = new ArrayList<>();
                    loopNodeConfigDto.getVariableArgs().forEach(inputArg -> {
                        if (inputArg.getBindValueType() == null || inputArg.getBindValueType() == Arg.BindValueType.Input) {
                            varOutputArgs.add(inputArg);
                            return;
                        }
                        Arg arg = argMap.get(inputArg.getBindValue());
                        if (arg != null) {
                            OutputArg outputArg = new OutputArg();
                            BeanUtils.copyProperties(inputArg, outputArg);
                            outputArg.setSubArgs(arg.getSubArgs());
                            varOutputArgs.add(outputArg);
                        }
                    });
                    generateKey(loopNode.getId() + "-var", varOutputArgs, argMap);
                    outputArgs.addAll(varOutputArgs);
                }
                if (outputArgs.size() > 0) {
                    PreviousNodeDto previousNodeDto = new PreviousNodeDto();
                    previousNodeDto.setId(loopNode.getId());
                    previousNodeDto.setName(loopNode.getName());
                    previousNodeDto.setType(loopNode.getType());
                    previousNodeDto.setOutputArgs(outputArgs);
                    if (!previousNodes.contains(previousNodeDto)) {
                        previousNodes.add(previousNodeDto);
                    }
                }
            }
            if (loopNode != null && loopNode.getInnerStartNodeId() != null && loopNode.getInnerStartNodeId() == workflowNodeDto.getId().longValue()) {
                setPreviousNodes(previousNodes, argMap, loopNode.getPreNodes(), workflowNodeDtoMap);
            }
        }
    }
    //previousNodes按照nodeId排序
    //previousNodes.sort(Comparator.comparing(PreviousNodeDto::getId));
    PreviousDto previousDto = new PreviousDto();
    previousDto.setPreviousNodes(previousNodes);
    previousDto.setInnerPreviousNodes(innerPreviousNodes);
    previousDto.setArgMap(argMap);
    return previousDto;
}
private void removeDeadLoopPreNodes(WorkflowNodeDto workflowNodeDto, Map<Long, WorkflowNodeDto> workflowNodeDtoMap) {
    Set<Long> ids = new HashSet<>();
    ids.add(workflowNodeDto.getId());
    removeDeadLoopPreNodes(workflowNodeDto, workflowNodeDtoMap, ids);
}
private void removeDeadLoopPreNodes(WorkflowNodeDto workflowNodeDto, Map<Long, WorkflowNodeDto> workflowNodeDtoMap, Set<Long> ids) {
    if (workflowNodeDto.getPreNodes() != null) {
        Iterator<WorkflowNodeDto> iterator = workflowNodeDto.getPreNodes().iterator();
        while (iterator.hasNext()) {
            WorkflowNodeDto nodeDto = iterator.next();
            if (ids.contains(nodeDto.getId())) {
                iterator.remove();
            } else {
                ids.add(nodeDto.getId());
                removeDeadLoopPreNodes(nodeDto, workflowNodeDtoMap, ids);
            }
        }
    }
    if (workflowNodeDto.getType() == WorkflowNodeConfig.NodeType.Loop && workflowNodeDto.getInnerEndNodeId() != null) {
        WorkflowNodeDto loopEndNode = workflowNodeDtoMap.get(workflowNodeDto.getInnerEndNodeId());
        if (loopEndNode != null) {
            removeDeadLoopPreNodes(loopEndNode, workflowNodeDtoMap, ids);
        }
    }
}
private void setPreviousNodes(List<PreviousNodeDto> previousNodes, Map<String, Arg> argMap, List<WorkflowNodeDto> preNodes, Map<Long, WorkflowNodeDto> workflowNodeDtoMap) {
    if (preNodes != null) {
        preNodes.forEach(preNode -> {
            if (!CollectionUtils.isEmpty(preNode.getNodeConfig().getOutputArgs())) {
                PreviousNodeDto previousNodeDto = new PreviousNodeDto();
                previousNodeDto.setId(preNode.getId());
                previousNodeDto.setName(preNode.getName());
                previousNodeDto.setLoopNodeId(preNode.getLoopNodeId());
                previousNodeDto.setType(preNode.getType());
                previousNodeDto.setOutputArgs(preNode.getNodeConfig().getOutputArgs());
                if (!previousNodes.contains(previousNodeDto)) {
                    previousNodes.add(previousNodeDto);
                }
                if (preNode.getType() == WorkflowNodeConfig.NodeType.Variable) {
                    VariableNodeConfigDto nodeConfigDto = (VariableNodeConfigDto) preNode.getNodeConfig();
                    if (nodeConfigDto.getConfigType() == VariableNodeConfigDto.ConfigTypeEnum.SET_VARIABLE) {
                        preNode.getNodeConfig().setOutputArgs(List.of(Arg.builder().name("isSuccess").dataType(DataTypeEnum.Boolean).build()));
                        previousNodeDto.setOutputArgs(preNode.getNodeConfig().getOutputArgs());
                    }
                }
                generateKey(preNode.getId().toString(), preNode.getNodeConfig().getOutputArgs(), argMap);
            }
            if (preNode.getType() == WorkflowNodeConfig.NodeType.Start) {
                if (preNode.getNodeConfig().getInputArgs() == null) {
                    preNode.getNodeConfig().setInputArgs(new ArrayList<>());
                }
                PreviousNodeDto previousNodeDto = new PreviousNodeDto();
                previousNodeDto.setId(preNode.getId());
                previousNodeDto.setName(preNode.getName());
                previousNodeDto.setType(preNode.getType());
                //preNode.getNodeConfig().getInputArgs()转outputArgs
                if (!previousNodes.contains(previousNodeDto)) {
                    List<Arg> outputArgs = preNode.getNodeConfig().getInputArgs().stream().map(inputArg -> {
                        OutputArg outputArg = new OutputArg();
                        BeanUtils.copyProperties(inputArg, outputArg);
                        return outputArg;
                    }).collect(Collectors.toList());
                    //追加系统变量
                    outputArgs.addAll(Arg.getSystemVariableArgs());
                    previousNodeDto.setOutputArgs(outputArgs);
                    previousNodes.add(previousNodeDto);
                    generateKey(preNode.getId().toString(), outputArgs, argMap);
                }
            }
            if (!CollectionUtils.isEmpty(preNode.getPreNodes())) {
                setPreviousNodes(previousNodes, argMap, preNode.getPreNodes(), workflowNodeDtoMap);
            }
            //循环节点外部节点也可以作为参数
            if (preNode.getLoopNodeId() != null && preNode.getLoopNodeId() > 0) {
                WorkflowNodeDto loopNode = workflowNodeDtoMap.get(preNode.getLoopNodeId());
                if (loopNode != null && loopNode.getInnerStartNodeId() != null && loopNode.getInnerStartNodeId() == preNode.getId().longValue()) {
                    if (!CollectionUtils.isEmpty(loopNode.getPreNodes())) {
                        List<WorkflowNodeDto> workflowNodeDtos = loopNode.getPreNodes().stream().filter(pre -> pre.getLoopNodeId() != null && pre.getLoopNodeId().longValue() == loopNode.getId()).collect(Collectors.toList());
                        loopNode.getPreNodes().removeAll(workflowNodeDtos);
                    }
                    setPreviousNodes(previousNodes, argMap, loopNode.getPreNodes(), workflowNodeDtoMap);
                }
            }
        });
    }
}
private void sortPreviousNodes(List<Long> nextNodeIds, Map<Long, WorkflowNodeDto> workflowNodeDtoMap, Map<Long, PreviousNodeDto> previousNodeDtoMap, AtomicInteger sort, Set<Long> sortedIdSet) {
    if (!CollectionUtils.isEmpty(nextNodeIds)) {
        nextNodeIds.forEach(nextId -> {
            if (sortedIdSet.contains(nextId)) {
                return;
            }
            sortedIdSet.add(nextId);
            WorkflowNodeDto workflowNodeDto = workflowNodeDtoMap.get(nextId);
            PreviousNodeDto previousNodeDto = previousNodeDtoMap.get(nextId);
            if (workflowNodeDto != null) {
                if (previousNodeDto != null) {
                    previousNodeDto.setSort(sort.getAndIncrement());
                }
                sortPreviousNodes(workflowNodeDto.getNextNodeIds(), workflowNodeDtoMap, previousNodeDtoMap, sort, sortedIdSet);
            }
        });
    }
}
public class PreviousDto implements Serializable {
    @Schema(description = "所有上级节点列表")
    private List<PreviousNodeDto> previousNodes;
    @Schema(description = "循环节点内部节点列表")
    private List<PreviousNodeDto> innerPreviousNodes;
    @Schema(description = "所有上级节点的输出参数Map")
    private Map<String, Arg> argMap;
}