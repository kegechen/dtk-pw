# DTK自动升级工作流

## 详细步骤

起点：向dtk仓库提修改debian/changelog（简称changelog）的PR（下文称之为“升级PR”）

1. **部署(action)**：使用environment阻塞，等待deploy，开始整个工作流
   - environment设置为需要人approve

2. **PR检查(action)**：检查升级PR的修改是否符合规范
   - 该步骤包括一些准备工作：清除该PR所有的commit status（防止rerun出错）
   - 该PR应该只包含changelog的修改
   - 检查需要升级的版本号是否符合规范，各个子模块的版本号应该低于需要升级的版本号

3. **分发PR(action)**：向需要升级的各个子模块分发修改debian/changelog的PR
   - 通过读取.gitmodules文件获取需要升级的子模块
   - 检查各个子模块track的分支是否与当前分支一致
   - 使用gbp生成各个子模块的changelog
   - 向各个需要升级的子模块发起PR
   - 为每一个子模块创建一个表示check通过状态的commit status，初始状态为pending
   - 创建一个表示dtk submodule是否已更新的commit status，初始状态为pending

4. **等待子模块check通过(webhook)**：等待所有的子模块的check通过，这里使用commit status表示状态
   - 监听workflow_run事件
   - 由webhook等待各个子模块的check全部通过，并修改对应的commit status的状态

5. **等待升级PR approve(webhook)**：webhook等待升级PR approve。这里的等待由两层机制保证
   - webhook监听PR的pull_request_review event。在收到该event时，计算该PR是否已经符合branch protection rules。如果符合的话，会继续接下来的流程
   - 当运行到检查PR是否approve的状态时，如果检查到approve，直接开始接下来的流程，否则退出，等待pull_request_review触发接下来的流程

6. **Approve并且merge各子模块的PR(webhook)**：该步骤由webhook完成
   - webhook以独立的身份approve action发起的PR
   - 通过GitHub API合并各子模块的PR并记录合并后的PR
   - 创建一个commit status表示所有子模块PR已合入

7. **更新submodule(webhook)**：该步骤由webhook完成
   - 记录合并后的PR到submodule中
   - 向dtk仓库推送submodule的更新
   - 修改表示submodule是否更新的commit status为done

8. **自动合并升级PR(webhook)**：该步骤由webhook完成

## Todo list

- [x] 部署(action)
- [x] PR检查(action)
- [x] 分发PR(action)
- [ ] 等待子模块check通过(webhook)
- [ ] 等待升级PR approve(webhook)
- [ ] Approve并且merge各子模块的PR(webhook)
- [ ] 更新submodule(webhook)
- [ ] 自动合并升级PR(webhook)
