SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SET NOCOUNT ON;

/* PARAMETERS */
DECLARE @FROMDATE CHAR(8) = '[FROM_REPLACEDATE]'
DECLARE @TODATE CHAR(8) = '[TO_REPLACEDATE]'

/* DEBUG */
SET @FROMDATE = '20240901'
SET @TODATE = '20241130'

/* ORG  */

DROP TABLE IF EXISTS #OrgHierachy
DROP TABLE IF EXISTS #hierdata

SELECT DPT.[Name],
       OHR.OMINTERNALORGANIZATIONCHILD_FK_RECID AS OrganizationRecId,
       OHR.OMINTERNALORGANIZATIONPARENT_FK_RECID AS OrganizationParentRecId,
       DPT.OMOPERATINGUNITTYPE AS OrganizationType,
       DPT.OMOPERATINGUNITNUMBER AS OrganizationCode
INTO #hierdata
FROM dbo.DIRPARTYTABLE AS DPT
    INNER JOIN dbo.[OMHIERARCHYRELATIONSHIPDATAENTITY_FUJ] AS OHR
        ON DPT.PARTYNUMBER = RTRIM(OHR.OMINTERNALORGANIZATIONCHILD_FK_PARTYNUMBER)
    INNER JOIN dbo.OMHIERARCHYTYPE AS OHT
        ON OHR.HIERARCHYTYPELOC = OHT.RECID
    LEFT JOIN dbo.OMHIERARCHYPURPOSE AS OHP
        ON OHR.HIERARCHYTYPELOC = OHP.HIERARCHYTYPE
WHERE DPT.ORGANIZATIONTYPE = 2 -- Udviklernote: 1 = 'Legal Entity'; 2 = 'Operating Unit'; 3 = 'Team'
      AND OHP.HIERARCHYPURPOSE = 3 -- Udviklernote: Årsag ukendt
      AND OHP.ISDEFAULT = 1
      AND OHR.VALIDTO >= GETDATE()

DROP TABLE IF EXISTS #hiertemp;
WITH hier
AS (SELECT hd.[Name],
           hd.[Name] AS ParentName,
           1 AS HierLevel,
           CAST(hd.OrganizationCode AS VARCHAR(MAX)) + '/' AS HierPath,
           hd.OrganizationRecId,
           hd.OrganizationParentRecId,
           hd.OrganizationType,
           hd.OrganizationCode
    --,hd.ValidFrom
    --,hd.ValidTo
    FROM #hierdata AS hd
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
        INNER JOIN #hierdata AS hd
            ON hd.OrganizationParentRecId = h.OrganizationRecId)
SELECT h.[Name],
       h.HierLevel,
       h.HierPath,
       h.OrganizationRecId,
       IIF(h.HierLevel = 1, NULL, h.OrganizationParentRecId) AS OrganizationParentRecId,
       h.OrganizationType,
       h.OrganizationCode
INTO #hiertemp
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
FROM #hiertemp AS h
    LEFT JOIN #hiertemp AS hp
        ON hp.OrganizationRecId = h.OrganizationParentRecId




-- Declare a cursor for a Table or a View 'TableOrViewName' in schema 'dbo'
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
    -- add instructions to be executed for every row
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


DROP TABLE IF EXISTS #FindTheDepartment

SELECT DISTINCT
    SUBSTRING(
        (
            SELECT ' | '+ST1.Name  AS [text()]
            FROM #OrgName ST1
            WHERE ST1.Id = ST2.Id
            ORDER BY ST1.HierLevel
            FOR XML PATH (''), TYPE
        ).value('text()[1]','nvarchar(max)'), 4, 4000) [Org]
INTO #FindTheDepartment
FROM #OrgName ST2
--WHERE ST2.Name = 'IT - Bibliotek'

ALTER TABLE #FindTheDepartment
ADD Name VARCHAR(128) NULL

UPDATE d
   Set d.Name = LTRIM(reverse(left(reverse(Org), charindex('|', reverse(Org)) -1))) 
FROM #FindTheDepartment AS d
WHERE Org LIKE '%|%'

DROP TABLE IF EXISTS #TopOrg

SELECT COALESCE(NULLIF(SUBSTRING(Org, 0, CHARINDEX('|', Org)),''),x.Name) OrgTop, Name
INTO #TopOrg
FROM (
SELECT SUBSTRING(Org, CHARINDEX('|', Org)+2, LEN(Org)-CHARINDEX('|', Org)), Name
FROM #FindTheDepartment) AS x(Org, Name)


DROP TABLE IF EXISTS #OrgHierachy
DROP TABLE IF EXISTS #hierdata

/* WORKFLOW */

/* GET USER INFO */
DROP TABLE IF EXISTS #USERINFO

SELECT 
    	dp.NAME AS NAME,
		NULLIF(hw.USER_, '') AS USER_,
    	NULLIF(p.DESCRIPTION, '') AS TITLE,
    	NULLIF(dpd.NAME, '') AS DEPARTMENTNAME,
    	NULLIF(p.DEPARTMENTNUMBER, '') AS DEPARTMENTNUMBER
    INTO #USERINFO
FROM dbo.HcmWorkerEntity hw                            
    LEFT JOIN dbo.DIRPERSONNAMEDATAENTITY_FUJ AS d             
    		ON d.DIRPERSONFKPARTYNUMBER = hw.PARTYNUMBER
    			AND GETDATE() BETWEEN d.VALIDFROM AND d.VALIDTO
    LEFT JOIN dbo.DirPartyTable dp               
    		ON hw.PERSONLOC = dp.RECID
    LEFT JOIN dbo.LogisticsElectronicAddress AS l
    		ON dp.PRIMARYCONTACTEMAIL = l.RECID
    LEFT JOIN dbo.HCMPOSITIONENTITY AS p               
    		ON p.WORKERPERSONNELNUMBER = hw.PERSONNELNUMBER
			AND p.ISPRIMARYPOSITION = 1
    LEFT JOIN dbo.DirPartyTable AS dpd           
    		ON dpd.OMOPERATINGUNITNUMBER = p.DEPARTMENTNUMBER
    			AND dpd.OMOPERATINGUNITTYPE = 1


DROP TABLE IF EXISTS #INVOICES;
DROP TABLE IF EXISTS #WORKFLOW;

DECLARE @DATAAREAID VARCHAR(8);

SET @DATAAREAID = (
		SELECT TOP 1 DATAAREA
		FROM DIRPARTYTABLE
		WHERE [INSTANCERELATIONTYPE] = (
				SELECT ID
				FROM TABLEIDTABLE
				WHERE name = 'companyinfo'
				)
			AND DATAAREA != 'dat'
		ORDER BY recid
		);

SELECT  v.DELIVERYNAME,
		v.DESCRIPTION,
		v.INVOICEACCOUNT,
		v.RECID, -- Join against contextrecid in WKtables
		vj.INVOICEAMOUNT,
		vj.DUEDATE,
	    vj.COSTLEDGERVOUCHER,
		V.PURCHNAME,
		vj.INVOICEID,
		vj.OMDEPARTMENTRECID, --RECID in DIRPARTYTABLE
		d.OMOPERATINGUNITNUMBER AS DEPARTMENTNUMBER,
		d.NAME AS DEPARTMENTNAME
 INTO #INVOICES
FROM dbo.VENDINVOICEINFOTABLE AS v
 INNER JOIN dbo.VENDINVOICEJOUR as vj
	ON v.SOURCEDOCUMENTHEADER = vj.SOURCEDOCUMENTHEADER
LEFT JOIN dbo.DIRPARTYTABLE AS d 
	ON vj.OMDEPARTMENTRECID = d.RECID

;WITH WORKFLOW
AS(
SELECT T1.DOCUMENT AS DOCUMENT,
	T1.INSTANCENUMBER AS CASEID,
	           CASE COALESCE(NULLIF(T2.NAME, ''), e.ENUMITEMNAME)
               WHEN 'Creation' THEN
                   'Oprettet'
               WHEN 'Completion' THEN
                   'Afsluttet'
               WHEN 'Delegation' THEN
                   'Delegering'
               WHEN 'Approval' THEN
                   'Godkendt'
               WHEN 'Fault' THEN
                   'Fejl'
               WHEN 'Cancellation' THEN
                   'Aflyst'
               WHEN 'Resume' THEN
                   'Fortsæt'
               WHEN 'Unrecovable' THEN
                   'Uoprettelig'
				 WHEN 'SubWorkflowElement' THEN
                   'Element'
								 WHEN 'SubWorkflowCompleted' THEN
                   'Afsluttet'
				   								 WHEN 'SubWorkflowStarted' THEN
                   'Start'
               ELSE
                   COALESCE(NULLIF(T2.NAME, ''), e.ENUMITEMNAME)
           END AS STEP_NAME,
	DENSE_RANK() OVER (PARTITION BY ELEMENTID, TRACKINGTYPE ORDER BY TRACKINGDATETIMETICKCOUNT ASC) AS USER_ROWNO,
	T2.USER_ AS USER_,
	T3.TOUSER AS TOUSER,
	T4.TRACKINGMESSAGE AS TRACKINGMESSAGE,
	e2.ENUMITEMNAME AS WORKFLOW_GROUP,
	e.ENUMITEMNAME AS WORKFLOW_STEP,
	TODATETIMEOFFSET(T2.CREATEDDATETIME,60) AS CREATEDDATETIME,	
	T2.TRACKINGCONTEXT,
	T2.ELEMENTID,
	ROW_NUMBER () OVER (PARTITION BY T1.INSTANCENUMBER ORDER BY TRACKINGDATETIMETICKCOUNT) AS CASE_SEQUENCE,
	T2.TRACKINGTYPE,
	t1.CONTEXTRECID,
	T1.CONFIGURATIONNAME,
	CASE T2.TRACKINGTYPE WHEN 15 THEN T4.TRACKINGMESSAGE ELSE NULL END AS FAULT_MESSAGE 
FROM WORKFLOWTRACKINGSTATUSTABLE T1
CROSS JOIN WORKFLOWTRACKINGTABLE T2
LEFT OUTER JOIN WORKFLOWTRACKINGWORKITEM T3 ON (
		(T2.RECID = T3.WORKFLOWTRACKINGTABLE)
		AND (T2.PARTITION = T3.PARTITION))
LEFT OUTER JOIN WORKFLOWTRACKINGCOMMENTTABLE T4 ON (
		(T2.RECID = T4.WORKFLOWTRACKINGTABLE)
		AND (T2.PARTITION = T4.PARTITION))
LEFT JOIN SRSANALYSISENUMS AS e ON T2.TRACKINGTYPE = e.ENUMITEMVALUE
	AND e.ENUMNAME = 'WorkflowTrackingType'
LEFT JOIN SRSANALYSISENUMS AS e2 ON T2.TRACKINGCONTEXT = e2.ENUMITEMVALUE
	AND e2.ENUMNAME = 'WorkflowTrackingContext'
WHERE T1.RECID = T2.WORKFLOWTRACKINGSTATUSTABLE
	AND T1.PARTITION = T2.PARTITION
	AND t2.TRACKINGCONTEXT NOT IN (36,15,4)
	AND TRACKINGTYPE <> 23
    AND T1.CREATEDDATETIME BETWEEN @FROMDATE AND @TODATE
    AND T2.CREATEDDATETIME BETWEEN @FROMDATE AND @TODATE
	--AND INSTANCENUMBER = 000018017--(1811,91)
	--AND CONTEXTRECID = 5638207255
)
SELECT w.CASEID,
	CASE TRACKINGCONTEXT WHEN 1 THEN CONCAT('Workflow (', w.STEP_NAME,')')	
						WHEN 2 THEN CONCAT('Under Workflow (', w.STEP_NAME,')')
						WHEN 6 THEN CONCAT('Under Workflow (', w.STEP_NAME,')')								
						WHEN 7 THEN CONCAT('Evaluering (', w.STEP_NAME,')')
						WHEN 5 THEN CONCAT('Arbejdsgang (', w.STEP_NAME,')')
						WHEN 2 THEN CONCAT('Godkendelse (', w.STEP_NAME,')')
						WHEN 3 THEN CONCAT('Opgave (', w.STEP_NAME,')')
						ELSE w.STEP_NAME END AS STEP_NAME,
	CASE WHEN w.TRACKINGTYPE = 9 THEN LAG(USER_,1,0) OVER(ORDER BY CASE_SEQUENCE ) ELSE w.USER_ END AS USER_,
	w.TRACKINGMESSAGE,
	w.WORKFLOW_GROUP,
	w.CREATEDDATETIME,
	w.USER_ROWNO,
	w.DOCUMENT,
	w.CASE_SEQUENCE,
	w.TRACKINGCONTEXT,
	w.ELEMENTID,
	w.CONTEXTRECID,
	w.TRACKINGTYPE,
	w.FAULT_MESSAGE
INTO #WORKFLOW
FROM WORKFLOW AS w

DROP TABLE IF EXISTS #RESULT

SELECT x.CASEID,
	   x.ACTION,
	   x.GROUPING,
       x.ORGANIZATIONROOT,
	   x.DEPARTMENTNAME,
       x.ORGANIZATIONPATH,
	   COALESCE(x.RESOURCE, 'SYSTEM') AS RESOURCE,
	   x.FAULT_MESSAGE,
	   x.INVOICEID,
	   x.PURCHNAME,	
	   X.DUEDATE,
	   X.CASE_SUM,
	   x.EVENT_START,
	   x.EVENT_END
INTO #RESULT
FROM(
SELECT w.CASEID,
		w.DOCUMENT,
		COALESCE(w.STEP_NAME, w.WORKFLOW_GROUP) AS ACTION,
		w.TRACKINGMESSAGE,
		ui.NAME AS RESOURCE,
		I.INVOICEID,
		I.PURCHNAME,
		COALESCE(UI.DEPARTMENTNAME,I.DEPARTMENTNAME) AS DEPARTMENTNAME,
		i.DEPARTMENTNUMBER,
		I.INVOICEACCOUNT,
		i.DUEDATE,
		CAST(i.INVOICEAMOUNT AS money) AS CASE_SUM,
		DATEADD(MILLISECOND, w.CASE_SEQUENCE*10 ,w.CREATEDDATETIME) AS EVENT_START,
		CAST(MAX(w.CREATEDDATETIME) OVER (PARTITION BY w.CASEID,ELEMENTID,TRACKINGCONTEXT ORDER BY CREATEDDATETIME DESC) AS DATETIME2(3)) AS EVENT_END,
		 w.CASE_SEQUENCE,
		 w.STEP_NAME,
		 CASE  WHEN w.TRACKINGTYPE=36 THEN 'Automatik' 
		 					 WHEN w.TRACKINGTYPE= 10 THEN 'Person'
							 WHEN w.TRACKINGTYPE= 4 THEN 'Person'
                             WHEN UI.NAME  IS NOT NULL THEN 'Person'
							 ELSE 'System' END AS GROUPING,
		w.FAULT_MESSAGE,
        COALESCE(fd.Org, fd2.Org) AS ORGANIZATIONPATH,
        COALESCE(tp.OrgTop, tp2.OrgTop ) AS ORGANIZATIONROOT
FROM #WORKFLOW AS w
INNER JOIN #INVOICES I ON 
	I.RECID = w.CONTEXTRECID
LEFT JOIN #USERINFO AS ui
    ON w.USER_ = ui.USER_
-- LEFT JOIN dbo.userinfo AS ui 
-- 	ON w.USER_ = ui.ID
LEFT JOIN #FindTheDepartment AS fd
    -- ON i.DEPARTMENTNAME = fd.Name
    ON ui.DEPARTMENTNAME = fd.Name
LEFT JOIN #FindTheDepartment AS fd2
     ON i.DEPARTMENTNAME = fd2.Name
LEFT JOIN #TopOrg AS tp
    -- on I.DEPARTMENTNAME = TP.Name
    ON ui.DEPARTMENTNAME = tp.Name
    LEFT JOIN #TopOrg AS tp2
     on I.DEPARTMENTNAME = tp2.Name
WHERE (w.STEP_NAME <> 'Completion' AND w.WORKFLOW_GROUP <> 'Approval')
) AS x
ORDER BY x.CASEID, x.CASE_SEQUENCE

DROP TABLE IF EXISTS #FindTheDepartment
DROP TABLE IF EXISTS #hiertemp
DROP TABLE IF EXISTS #INVOICES
DROP TABLE IF EXISTS #Organization
DROP TABLE IF EXISTS #OrgName
DROP TABLE IF EXISTS #TopOrg
DROP TABLE IF EXISTS #USERINFO
DROP TABLE IF EXISTS #WORKFLOW

;WITH Results
AS (
	SELECT CAST(x.CASEID AS BIGINT) AS CASEID
		,x.ACTION
		,x.GROUPING
		,x.ORGANIZATIONROOT
		,x.DEPARTMENTNAME
		,x.ORGANIZATIONPATH
		,x.RESOURCE
		,x.FAULT_MESSAGE
		,x.INVOICEID
		,x.PURCHNAME
		,CAST(X.DUEDATE AS DATE) AS DUEDATE
		,FORMAT(COALESCE(x.CASE_SUM, 0.0), 'N2', 'en-US') AS CASE_SUM
		,FORMAT(x.EVENT_START, 'yyyy-MM-dd HH:mm:ss.fff') AS EVENT_START
		,
		--    FORMAT(    --         IIF(COALESCE(    --             DATEADD(SECOND, -1, LEAD(x.EVENT_START) OVER (PARTITION BY x.CASEID ORDER BY CASE_SEQUENCE)),    --             x.EVENT_END    --         ) > EVENT_START, DATEADD(SECOND, 1, EVENT_START),  COALESCE(    --             DATEADD(SECOND, -1, LEAD(x.EVENT_START) OVER (PARTITION BY x.CASEID ORDER BY CASE_SEQUENCE)),    --             x.EVENT_END    --         )),    --         'yyyy-MM-dd HH:mm:ss.fff') AS EVENT_END    
		FORMAT(DATEADD(MILLISECOND, - 1, LEAD(x.EVENT_START) OVER (
					PARTITION BY x.CASEID ORDER BY EVENT_START
					)), 'yyyy-MM-dd HH:mm:ss.fff') AS EVENT_END
        FROM #Result AS x
        WHERE EVENT_END IS NOT NULL
		    AND X.EVENT_START IS NOT NULL
		--  AND CASEID = 1246107 
	)
SELECT CASEID
	,ACTION
	,GROUPING
	,ORGANIZATIONROOT
	,DEPARTMENTNAME
	,ORGANIZATIONPATH
	,RESOURCE
	,FAULT_MESSAGE
	,INVOICEID
	,PURCHNAME
	,DUEDATE
	,CASE_SUM
	,EVENT_START
	,COALESCE(EVENT_END, DATEADD(SECOND, 1, EVENT_START)) AS EVENT_END
FROM Results AS r