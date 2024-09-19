import {forwardRef, memo, useImperativeHandle, useState} from "react";
import {Tree} from "antd";
import {FileOutlined, FolderOutlined} from "@ant-design/icons";

const updateTreeData = (list, key, children) => {
    return list.map((node) => {
        if (node.key === key) {
            return {
                ...node,
                children,
            };
        }
        if (node.children) {
            return {
                ...node,
                children: updateTreeData(node.children, key, children),
            };
        }
        return node;
    });
}

const FilesList = memo(forwardRef((props, ref) => {
    const {currentSelectFileInLeftList, setCurrentSelectFileInLeftList} = props;
    const [dirTreeData, setDirTreeData] = useState([]);

    const selectDir = async () => {
        // 选择一个文件夹后获取到一个句柄
        const rootHandel = await showDirectoryPicker();
        // 设置根节点
        const rootTreeNode = createTreeNode(
            rootHandel,
            "/" + rootHandel.name
        )
        setDirTreeData([rootTreeNode]);
    }

    const onLoadData = ({children, key, handel}) => {
        return new Promise((resolve) => {
            if (children) {
                resolve();
                return;
            }
            setDirTree(handel, key).then(res => {
                setDirTreeData((origin) =>
                    updateTreeData(origin, key, res),
                );
                resolve();
            })
        });
    }

    const setDirTree = async (rootHandel, parentKey) => {
        const currentRankFiles = [];
        for await (let currentHandel of rootHandel) {
            const handel = currentHandel[1];
            // 以文件路径作为 key
            const uniqueKey = parentKey + "/" + handel.name;
            currentRankFiles.push(createTreeNode(
                handel,
                uniqueKey,
                handel.kind === "file" ? await handel.getFile() : null))
        }
        // 按照文件夹在前，文件在后排序
        currentRankFiles.sort((a, b) => {
            if (a.kind === 'directory' && b.kind === 'file') {
                return -1;
            }
            if (a.kind === 'file' && b.kind === 'directory') {
                return 1;
            }
            return 0;
        })
        return currentRankFiles;
    }

    const createTreeNode = (handel, key, file = null) => {
        return {
            handel,
            title: handel.name,
            kind: handel.kind,
            file,
            icon: handel.kind === "directory" ?
                <FolderOutlined style={ {color: "#d686ff"} }/> :
                <FileOutlined style={ {color: "#79d7dc"} }/>,
            key,
            isLeaf: handel.kind !== "directory" // 是否为叶子节点
        }
    }

    const onSelect = (_, e) => {
        // 如果选中的是文件
        if (e.node.file) {
            setCurrentSelectFileInLeftList({key: e.node.key, file: e.node.file})
        }
    }

    useImperativeHandle(ref, () => ({
        selectDir,
    }));
    return (
        dirTreeData.length !== 0 && <div className="filesList">
            <Tree
                autoExpandParent={ true }
                showLine={ false }
                showIcon={ true }
                onSelect={ onSelect }
                treeData={ dirTreeData }
                loadData={ onLoadData }
                selectedKeys={ [currentSelectFileInLeftList.key] }
            />
        </div>
    );
}));

export default FilesList;
