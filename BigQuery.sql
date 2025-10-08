SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SET NOCOUNT ON;

/* PARAMETERS */
DECLARE @FROMDATE CHAR(8) = '[FROM_REPLACEDATE]'
DECLARE @TODATE CHAR(8) = '[TO_REPLACEDATE]'

/* DEBUG */
SET @FROMDATE = '20240901'
SET @TODATE = '20241130'

/* ORGANIZATION HIERARCHY */

DROP TABLE IF EXISTS #OrgHierarchy
DROP TABLE IF EXISTS #HierData

SELECT DPT.[Name],
       OHR.CHILD_FK_RECID AS OrganizationRecId,
       OHR.PARENT_FK_RECID AS OrganizationParentRecId,
       DPT.UNIT_TYPE AS OrganizationType,
       DPT.UNIT_NUMBER AS OrganizationCode
INTO #HierData
FROM dbo.ENTITY_TABLE AS DPT
    INNER JOIN dbo.[HIERARCHY_RELATIONSHIP] AS OHR
        ON DPT.ENTITY_NUMBER = RTRIM(OHR.CHILD_FK_ENTITY_NUMBER)
    INNER JOIN dbo.HIERARCHY_TYPE AS OHT
        ON OHR.HIERARCHY_TYPE_ID = OHT.RECID
    LEFT JOIN dbo.HIERARCHY_PURPOSE AS OHP
        ON OHR.HIERARCHY_TYPE_ID = OHP.HIERARCHY_TYPE
WHERE DPT.ORGANIZATION_TYPE = 2 -- Note: 1 = 'Legal Entity'; 2 = 'Operating Unit'; 3 = 'Team'
      AND OHP.HIERARCHY_PURPOSE = 3 -- Note: Purpose filter
      AND OHP.IS_DEFAULT = 1
      AND OHR.VALID_TO >= GETDATE()

DROP TABLE IF EXISTS #HierTemp;
WITH hier
AS (SELECT hd.[Name],
           hd.[Name] AS ParentName,
           1 AS HierLevel,
           CAST(hd.OrganizationCode AS VARCHAR(MAX)) + '/' AS HierPath,
           hd.OrganizationRecId,
           hd.OrganizationParentRecId,
           hd.OrganizationType,
           hd.OrganizationCode
    FROM #HierData AS hd
    UNION ALL
    SELECT hd.[Name],
           h.ParentName,
           h.HierLevel + 1 AS HierLevel,
           h.HierPath + CAST(hd.OrganizationCode AS VARCHAR(MAX)) + '/' AS HierPath,
           hd.OrganizationRecId,
           hd.OrganizationParentRecId,
           hd.OrganizationType,
           hd.OrganizationCode
    FROM hier AS h
        INNER JOIN #HierData AS hd
            ON hd.OrganizationParentRecId = h.OrganizationRecId)
SELECT h.[Name],
       h.HierLevel,
       h.HierPath,
       h.OrganizationRecId,
       IIF(h.HierLevel = 1, NULL, h.OrganizationParentRecId) AS OrganizationParentRecId,
       h.OrganizationType,
       h.OrganizationCode
INTO #HierTemp
FROM
(
    SELECT h.[Name],
           h.HierLevel,
           h.HierPath,
           h.OrganizationRecId,
           h.OrganizationParentRecId,
           h.OrganizationType,
           h.OrganizationCode,
           ROW_NUMBER() OVER (PARTITION BY h.OrganizationRecId ORDER BY h.HierLevel DESC) AS rn
    FROM hier AS h
) AS h
WHERE h.rn = 1

DROP TABLE IF EXISTS #Organization

SELECT hp.[Name] AS ParentName,
       h.[Name] AS Name,
       h.HierLevel,
       h.HierPath,
       h.OrganizationRecId,
       h.OrganizationParentRecId,
       h.OrganizationType,
       h.OrganizationCode
INTO #Organization
FROM #HierTemp AS h
    LEFT JOIN #HierTemp AS hp
        ON hp.OrganizationRecId = h.OrganizationParentRecId

-- Example cursor operation for organization processing
DECLARE @ColumnName1 NVARCHAR(50), @Id INT = 1

DROP TABLE IF EXISTS #OrgName 

CREATE TABLE #OrgName 
(
    Id INT,
    Name VARCHAR(128),
    ParentName VARCHAR(128),
    Code VARCHAR(128),
    HierLevel INT
)

DECLARE db_cursor CURSOR FOR
SELECT DISTINCT Name
FROM #Organization

OPEN db_cursor
FETCH NEXT FROM db_cursor INTO @ColumnName1

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Process each organization
    INSERT INTO #OrgName (Id, Name, ParentName, Code, HierLevel)
    SELECT @Id,o.Name, O.ParentName, O.OrganizationCode, O.HierLevel
    FROM #Organization AS o
        CROSS APPLY #Organization AS oo
    WHERE oo.HierPath LIKE o.HierPath + '%'
    AND oo.Name = @ColumnName1
    EXCEPT
    SELECT Id, Name, ParentName, Code, HierLevel
    FROM #OrgName

    SET @Id += 1
    FETCH NEXT FROM db_cursor INTO @ColumnName1
END

CLOSE db_cursor
DEALLOCATE db_cursor

DROP TABLE IF EXISTS #DepartmentLookup

SELECT DISTINCT
    SUBSTRING(
        (
            SELECT ' | '+ST1.Name  AS [text()]
            FROM #OrgName ST1
            WHERE ST1.Id = ST2.Id
            ORDER BY ST1.HierLevel
            FOR XML PATH (''), TYPE
        ).value('text()[1]','nvarchar(max)'), 4, 4000) [Org]
INTO #DepartmentLookup
FROM #OrgName ST2

ALTER TABLE #DepartmentLookup
ADD Name VARCHAR(128) NULL

UPDATE d
   Set d.Name = LTRIM(reverse(left(reverse(Org), charindex('|', reverse(Org)) -1))) 
FROM #DepartmentLookup AS d
WHERE Org LIKE '%|%'

DROP TABLE IF EXISTS #TopOrg

SELECT COALESCE(NULLIF(SUBSTRING(Org, 0, CHARINDEX('|', Org)),''),x.Name) OrgTop, Name
INTO #TopOrg
FROM (
SELECT SUBSTRING(Org, CHARINDEX('|', Org)+2, LEN(Org)-CHARINDEX('|', Org)), Name
FROM #DepartmentLookup) AS x(Org, Name)

DROP TABLE IF EXISTS #OrgHierarchy
DROP TABLE IF EXISTS #HierData

/* WORKFLOW PROCESSING */

/* GET USER INFORMATION */
DROP TABLE IF EXISTS #UserInfo

SELECT 
    	dp.NAME AS NAME,
		NULLIF(hw.USER_ID, '') AS USER_ID,
    	NULLIF(p.DESCRIPTION, '') AS TITLE,
    	NULLIF(dpd.NAME, '') AS DEPARTMENT_NAME,
    	NULLIF(p.DEPARTMENT_NUMBER, '') AS DEPARTMENT_NUMBER
    INTO #UserInfo
FROM dbo.WORKER_ENTITY hw                            
    LEFT JOIN dbo.PERSON_NAME_DATA AS d             
    		ON d.PERSON_FK_ENTITY_NUMBER = hw.ENTITY_NUMBER
    			AND GETDATE() BETWEEN d.VALID_FROM AND d.VALID_TO
    LEFT JOIN dbo.ENTITY_TABLE dp               
    		ON hw.PERSON_ID = dp.RECID
    LEFT JOIN dbo.ELECTRONIC_ADDRESS AS l
    		ON dp.PRIMARY_CONTACT_EMAIL = l.RECID
    LEFT JOIN dbo.POSITION_ENTITY AS p               
    		ON p.WORKER_PERSONNEL_NUMBER = hw.PERSONNEL_NUMBER
			AND p.IS_PRIMARY_POSITION = 1
    LEFT JOIN dbo.ENTITY_TABLE AS dpd           
    		ON dpd.UNIT_NUMBER = p.DEPARTMENT_NUMBER
    			AND dpd.UNIT_TYPE = 1

DROP TABLE IF EXISTS #Documents;
DROP TABLE IF EXISTS #WorkflowData;

DECLARE @DATA_AREA_ID VARCHAR(8);

SET @DATA_AREA_ID = (
		SELECT TOP 1 DATA_AREA
		FROM ENTITY_TABLE
		WHERE [INSTANCE_RELATION_TYPE] = (
				SELECT ID
				FROM TABLE_ID_TABLE
				WHERE name = 'company_info'
				)
			AND DATA_AREA != 'dat'
		ORDER BY recid
		);

SELECT  v.DELIVERY_NAME,
		v.DESCRIPTION,
		v.ACCOUNT_ID,
		v.RECID, -- Join against context_recid in workflow tables
		vj.AMOUNT,
		vj.DUE_DATE,
	    vj.LEDGER_VOUCHER,
		V.PURCHASE_NAME,
		vj.DOCUMENT_ID,
		vj.DEPARTMENT_RECID, --RECID in ENTITY_TABLE
		d.UNIT_NUMBER AS DEPARTMENT_NUMBER,
		d.NAME AS DEPARTMENT_NAME
 INTO #Documents
FROM dbo.DOCUMENT_INFO_TABLE AS v
 INNER JOIN dbo.DOCUMENT_JOURNAL as vj
	ON v.SOURCE_DOCUMENT_HEADER = vj.SOURCE_DOCUMENT_HEADER
LEFT JOIN dbo.ENTITY_TABLE AS d 
	ON vj.DEPARTMENT_RECID = d.RECID

;WITH WORKFLOW
AS(
SELECT T1.DOCUMENT AS DOCUMENT,
	T1.INSTANCE_NUMBER AS CASE_ID,
	           CASE COALESCE(NULLIF(T2.NAME, ''), e.ENUM_ITEM_NAME)
               WHEN 'Creation' THEN
                   'Created'
               WHEN 'Completion' THEN
                   'Completed'
               WHEN 'Delegation' THEN
                   'Delegated'
               WHEN 'Approval' THEN
                   'Approved'
               WHEN 'Fault' THEN
                   'Error'
               WHEN 'Cancellation' THEN
                   'Cancelled'
               WHEN 'Resume' THEN
                   'Resumed'
               WHEN 'Unrecovable' THEN
                   'Unrecoverable'
				 WHEN 'SubWorkflowElement' THEN
                   'Element'
				 WHEN 'SubWorkflowCompleted' THEN
                   'Completed'
				 WHEN 'SubWorkflowStarted' THEN
                   'Started'
               ELSE
                   COALESCE(NULLIF(T2.NAME, ''), e.ENUM_ITEM_NAME)
           END AS STEP_NAME,
	DENSE_RANK() OVER (PARTITION BY ELEMENT_ID, TRACKING_TYPE ORDER BY TRACKING_DATETIME_TICK_COUNT ASC) AS USER_ROW_NO,
	T2.USER_ID AS USER_ID,
	T3.TO_USER AS TO_USER,
	T4.TRACKING_MESSAGE AS TRACKING_MESSAGE,
	e2.ENUM_ITEM_NAME AS WORKFLOW_GROUP,
	e.ENUM_ITEM_NAME AS WORKFLOW_STEP,
	TODATETIMEOFFSET(T2.CREATED_DATETIME,60) AS CREATED_DATETIME,	
	T2.TRACKING_CONTEXT,
	T2.ELEMENT_ID,
	ROW_NUMBER () OVER (PARTITION BY T1.INSTANCE_NUMBER ORDER BY TRACKING_DATETIME_TICK_COUNT) AS CASE_SEQUENCE,
	T2.TRACKING_TYPE,
	t1.CONTEXT_RECID,
	T1.CONFIGURATION_NAME,
	CASE T2.TRACKING_TYPE WHEN 15 THEN T4.TRACKING_MESSAGE ELSE NULL END AS FAULT_MESSAGE 
FROM WORKFLOW_TRACKING_STATUS_TABLE T1
CROSS JOIN WORKFLOW_TRACKING_TABLE T2
LEFT OUTER JOIN WORKFLOW_TRACKING_WORKITEM T3 ON (
		(T2.RECID = T3.WORKFLOW_TRACKING_TABLE)
		AND (T2.PARTITION = T3.PARTITION))
LEFT OUTER JOIN WORKFLOW_TRACKING_COMMENT_TABLE T4 ON (
		(T2.RECID = T4.WORKFLOW_TRACKING_TABLE)
		AND (T2.PARTITION = T4.PARTITION))
LEFT JOIN ANALYSIS_ENUMS AS e ON T2.TRACKING_TYPE = e.ENUM_ITEM_VALUE
	AND e.ENUM_NAME = 'WorkflowTrackingType'
LEFT JOIN ANALYSIS_ENUMS AS e2 ON T2.TRACKING_CONTEXT = e2.ENUM_ITEM_VALUE
	AND e2.ENUM_NAME = 'WorkflowTrackingContext'
WHERE T1.RECID = T2.WORKFLOW_TRACKING_STATUS_TABLE
	AND T1.PARTITION = T2.PARTITION
	AND t2.TRACKING_CONTEXT NOT IN (36,15,4)
	AND TRACKING_TYPE <> 23
    AND T1.CREATED_DATETIME BETWEEN @FROMDATE AND @TODATE
    AND T2.CREATED_DATETIME BETWEEN @FROMDATE AND @TODATE
)
SELECT w.CASE_ID,
	CASE TRACKING_CONTEXT WHEN 1 THEN CONCAT('Workflow (', w.STEP_NAME,')')	
						WHEN 2 THEN CONCAT('Sub Workflow (', w.STEP_NAME,')')
						WHEN 6 THEN CONCAT('Sub Workflow (', w.STEP_NAME,')')								
						WHEN 7 THEN CONCAT('Evaluation (', w.STEP_NAME,')')
						WHEN 5 THEN CONCAT('Process (', w.STEP_NAME,')')
						WHEN 2 THEN CONCAT('Approval (', w.STEP_NAME,')')
						WHEN 3 THEN CONCAT('Task (', w.STEP_NAME,')')
						ELSE w.STEP_NAME END AS STEP_NAME,
	CASE WHEN w.TRACKING_TYPE = 9 THEN LAG(USER_ID,1,0) OVER(ORDER BY CASE_SEQUENCE ) ELSE w.USER_ID END AS USER_ID,
	w.TRACKING_MESSAGE,
	w.WORKFLOW_GROUP,
	w.CREATED_DATETIME,
	w.USER_ROW_NO,
	w.DOCUMENT,
	w.CASE_SEQUENCE,
	w.TRACKING_CONTEXT,
	w.ELEMENT_ID,
	w.CONTEXT_RECID,
	w.TRACKING_TYPE,
	w.FAULT_MESSAGE
INTO #WorkflowData
FROM WORKFLOW AS w

DROP TABLE IF EXISTS #Result

SELECT x.CASE_ID,
	   x.ACTION,
	   x.GROUPING,
       x.ORGANIZATION_ROOT,
	   x.DEPARTMENT_NAME,
       x.ORGANIZATION_PATH,
	   COALESCE(x.RESOURCE, 'SYSTEM') AS RESOURCE,
	   x.FAULT_MESSAGE,
	   x.DOCUMENT_ID,
	   x.PURCHASE_NAME,	
	   X.DUE_DATE,
	   X.CASE_SUM,
	   x.EVENT_START,
	   x.EVENT_END
INTO #Result
FROM(
SELECT w.CASE_ID,
		w.DOCUMENT,
		COALESCE(w.STEP_NAME, w.WORKFLOW_GROUP) AS ACTION,
		w.TRACKING_MESSAGE,
		ui.NAME AS RESOURCE,
		I.DOCUMENT_ID,
		I.PURCHASE_NAME,
		COALESCE(UI.DEPARTMENT_NAME,I.DEPARTMENT_NAME) AS DEPARTMENT_NAME,
		i.DEPARTMENT_NUMBER,
		I.ACCOUNT_ID,
		i.DUE_DATE,
		CAST(i.AMOUNT AS money) AS CASE_SUM,
		DATEADD(MILLISECOND, w.CASE_SEQUENCE*10 ,w.CREATED_DATETIME) AS EVENT_START,
		CAST(MAX(w.CREATED_DATETIME) OVER (PARTITION BY w.CASE_ID,ELEMENT_ID,TRACKING_CONTEXT ORDER BY CREATED_DATETIME DESC) AS DATETIME2(3)) AS EVENT_END,
		 w.CASE_SEQUENCE,
		 w.STEP_NAME,
		 CASE  WHEN w.TRACKING_TYPE=36 THEN 'Automatic' 
		 					 WHEN w.TRACKING_TYPE= 10 THEN 'Person'
							 WHEN w.TRACKING_TYPE= 4 THEN 'Person'
                             WHEN UI.NAME  IS NOT NULL THEN 'Person'
							 ELSE 'System' END AS GROUPING,
		w.FAULT_MESSAGE,
        COALESCE(fd.Org, fd2.Org) AS ORGANIZATION_PATH,
        COALESCE(tp.OrgTop, tp2.OrgTop ) AS ORGANIZATION_ROOT
FROM #WorkflowData AS w
INNER JOIN #Documents I ON 
	I.RECID = w.CONTEXT_RECID
LEFT JOIN #UserInfo AS ui
    ON w.USER_ID = ui.USER_ID
LEFT JOIN #DepartmentLookup AS fd
    ON ui.DEPARTMENT_NAME = fd.Name
LEFT JOIN #DepartmentLookup AS fd2
     ON i.DEPARTMENT_NAME = fd2.Name
LEFT JOIN #TopOrg AS tp
    ON ui.DEPARTMENT_NAME = tp.Name
    LEFT JOIN #TopOrg AS tp2
     on I.DEPARTMENT_NAME = tp2.Name
WHERE (w.STEP_NAME <> 'Completion' AND w.WORKFLOW_GROUP <> 'Approval')
) AS x
ORDER BY x.CASE_ID, x.CASE_SEQUENCE

DROP TABLE IF EXISTS #DepartmentLookup
DROP TABLE IF EXISTS #HierTemp
DROP TABLE IF EXISTS #Documents
DROP TABLE IF EXISTS #Organization
DROP TABLE IF EXISTS #OrgName
DROP TABLE IF EXISTS #TopOrg
DROP TABLE IF EXISTS #UserInfo
DROP TABLE IF EXISTS #WorkflowData

;WITH Results
AS (
	SELECT CAST(x.CASE_ID AS BIGINT) AS CASE_ID
		,x.ACTION
		,x.GROUPING
		,x.ORGANIZATION_ROOT
		,x.DEPARTMENT_NAME
		,x.ORGANIZATION_PATH
		,x.RESOURCE
		,x.FAULT_MESSAGE
		,x.DOCUMENT_ID
		,x.PURCHASE_NAME
		,CAST(X.DUE_DATE AS DATE) AS DUE_DATE
		,FORMAT(COALESCE(x.CASE_SUM, 0.0), 'N2', 'en-US') AS CASE_SUM
		,FORMAT(x.EVENT_START, 'yyyy-MM-dd HH:mm:ss.fff') AS EVENT_START
		,FORMAT(DATEADD(MILLISECOND, - 1, LEAD(x.EVENT_START) OVER (
					PARTITION BY x.CASE_ID ORDER BY EVENT_START
					)), 'yyyy-MM-dd HH:mm:ss.fff') AS EVENT_END
        FROM #Result AS x
        WHERE EVENT_END IS NOT NULL
		    AND X.EVENT_START IS NOT NULL
	)
SELECT CASE_ID
	,ACTION
	,GROUPING
	,ORGANIZATION_ROOT
	,DEPARTMENT_NAME
	,ORGANIZATION_PATH
	,RESOURCE
	,FAULT_MESSAGE
	,DOCUMENT_ID
	,PURCHASE_NAME
	,DUE_DATE
	,CASE_SUM
	,EVENT_START
	,COALESCE(EVENT_END, DATEADD(SECOND, 1, EVENT_START)) AS EVENT_END
FROM Results AS r